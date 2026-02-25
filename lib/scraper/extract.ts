/**
 * Claude API extraction: parse scraped text into structured deal data.
 */

import Anthropic from "@anthropic-ai/sdk";
import { END_MARKETS } from "./config";
import { ScrapeResult } from "./scrape";

export interface ExtractedDeal {
  company_name: string;
  investor: string;
  amount_raised: number | null;
  end_market: string;
  description: string;
  date: string;
  source_url: string;
}

const EXTRACTION_PROMPT = `You are a growth equity deal extraction assistant. Analyze the following text scraped from a news source or investment firm website and extract any growth equity / private equity deals announced.

For EACH deal found, extract:
- company_name: The portfolio company receiving investment
- investor: The PE/growth equity firm investing (must be one of the tracked firms if from a firm page)
- amount_raised: Dollar amount in USD (number only, no formatting). Use null if undisclosed.
- end_market: Classify into exactly one of these categories: {end_markets}
- description: 1-2 sentence summary of what the company does
- date: The actual deal announcement or close date in YYYY-MM-DD format. Look for dates in the text such as press release dates, "announced today" references, or explicit close dates. If you absolutely cannot determine the date, skip the deal entirely — do NOT use today's date as a fallback.
- source_url: The URL this was scraped from (provided below)

IMPORTANT RULES:
- Only extract GROWTH EQUITY or PRIVATE EQUITY deals (not venture/seed, not M&A/acquisitions, not debt)
- The investor must be a PE/growth equity firm, not a strategic acquirer
- Skip deals older than 3 days
- Skip duplicate mentions of the same deal
- If no relevant deals are found, return an empty array

Source name: {source_name}
Source URL: {source_url}
Today's date: {today}

Respond with ONLY a JSON array of deal objects. No markdown, no explanation.
Example: [{{"company_name": "Acme Corp", "investor": "Summit Partners", "amount_raised": 50000000, "end_market": "FinTech", "description": "Acme Corp provides...", "date": "2026-02-20", "source_url": "https://..."}}]

If no deals found, respond with: []

--- SCRAPED TEXT ---
{text}`;

function buildPrompt(source: ScrapeResult): string {
  const today = new Date().toISOString().slice(0, 10);
  return EXTRACTION_PROMPT.replace("{end_markets}", END_MARKETS.join(", "))
    .replace("{source_name}", source.source_name)
    .replace("{source_url}", source.source_url)
    .replace("{today}", today)
    .replace("{text}", source.text);
}

function parseDealsFromResponse(content: string): ExtractedDeal[] {
  let cleaned = content.trim();

  // Handle markdown code blocks
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.split("```")[1];
    if (cleaned.startsWith("json")) {
      cleaned = cleaned.slice(4);
    }
    cleaned = cleaned.trim();
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

/**
 * Extract deals from scraped sources using Claude API.
 * Processes sources in parallel batches.
 */
export async function extractDealsFromSources(
  sources: ScrapeResult[],
  batchSize = 2
): Promise<{ deals: ExtractedDeal[]; errors: string[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { deals: [], errors: ["ANTHROPIC_API_KEY not set"] };
  }

  const client = new Anthropic({ apiKey });
  const allDeals: ExtractedDeal[] = [];
  const errors: string[] = [];

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (source) => {
        console.log(`  Extracting from: ${source.source_name}`);
        const prompt = buildPrompt(source);

        const response = await client.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        });

        const text =
          response.content[0].type === "text" ? response.content[0].text : "";
        const deals = parseDealsFromResponse(text);

        if (deals.length > 0) {
          console.log(`    Found ${deals.length} deal(s)`);
        } else {
          console.log(`    No deals found`);
        }
        return deals;
      })
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === "fulfilled") {
        allDeals.push(...result.value);
      } else {
        const sourceName = batch[j].source_name;
        const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        console.log(`  [ERROR] Claude API error for ${sourceName}: ${msg}`);
        errors.push(`${sourceName}: ${msg}`);
      }
    }
  }

  return { deals: allDeals, errors };
}
