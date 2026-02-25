/**
 * Scraper orchestrator: runs the full scrape → extract → dedup → insert pipeline.
 */

import { prisma } from "@/lib/db";
import { ALL_SOURCES } from "./config";
import { scrapeAllSources } from "./scrape";
import { extractDealsFromSources, ExtractedDeal } from "./extract";
import { deduplicateDeals, ExistingDeal } from "./dedup";

export interface ScraperResult {
  success: boolean;
  sourcesScraped: number;
  dealsExtracted: number;
  dealsInserted: number;
  errors: string[];
  durationMs: number;
}

/**
 * Run the full scraper pipeline:
 * 1. Scrape all sources (parallel batches of 10)
 * 2. Extract deals via Claude (parallel batches of 5)
 * 3. Fetch recent deals from DB for dedup
 * 4. Deduplicate
 * 5. Insert new deals
 */
export async function runScraper(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];

  console.log("=".repeat(60));
  console.log("  Wavecrest Deal Tracker — Daily Scraper (TypeScript)");
  console.log(`  ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  // 1. Scrape all sources
  console.log("\n=== Scraping all sources ===");
  const scraped = await scrapeAllSources(ALL_SOURCES);
  console.log(`\n>>> Scraped ${scraped.length} sources successfully`);

  // 2. Extract deals using Claude
  console.log("\n=== Extracting deals with Claude ===");
  const { deals: allExtracted, errors: extractErrors } =
    await extractDealsFromSources(scraped);
  errors.push(...extractErrors);
  console.log(`\n>>> Total deals extracted: ${allExtracted.length}`);

  if (allExtracted.length === 0) {
    console.log("\nNo deals to process. Done.");
    return {
      success: true,
      sourcesScraped: scraped.length,
      dealsExtracted: 0,
      dealsInserted: 0,
      errors,
      durationMs: Date.now() - start,
    };
  }

  // 3. Fetch all deals from DB for dedup — including soft-deleted ones so
  //    manually deleted deals don't get re-inserted by the scraper
  console.log("\n=== Deduplicating against existing deals ===");

  const existingRows = await prisma.deal.findMany({
    select: {
      id: true,
      company_name: true,
      investor: true,
      date: true,
    },
  });

  const existing: ExistingDeal[] = existingRows.map((row) => ({
    id: row.id,
    company_name: row.company_name,
    investor: row.investor,
    date:
      row.date instanceof Date
        ? row.date.toISOString().slice(0, 10)
        : String(row.date),
  }));

  console.log(`  Existing deals in last 30 days: ${existing.length}`);

  // 4. Deduplicate
  const { newDeals, skipped } = deduplicateDeals(allExtracted, existing);
  console.log(`\n>>> New unique deals: ${newDeals.length} (skipped ${skipped} duplicates)`);

  // 5. Insert new deals
  let insertedCount = 0;
  if (newDeals.length > 0) {
    console.log("\n=== Inserting new deals into database ===");
    try {
      const rows = newDeals.map(dealToRow);
      const result = await prisma.deal.createMany({ data: rows });
      insertedCount = result.count;
      console.log(`  Inserted ${insertedCount} deal(s)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  [ERROR] Insert failed: ${msg}`);
      errors.push(`Insert failed: ${msg}`);
    }
  }

  const durationMs = Date.now() - start;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Done in ${(durationMs / 1000).toFixed(1)}s — ${insertedCount} new deal(s)`);
  console.log("=".repeat(60));

  return {
    success: true,
    sourcesScraped: scraped.length,
    dealsExtracted: allExtracted.length,
    dealsInserted: insertedCount,
    errors,
    durationMs,
  };
}

function dealToRow(deal: ExtractedDeal) {
  return {
    date: new Date(deal.date || new Date().toISOString().slice(0, 10)),
    company_name: deal.company_name || "",
    investor: deal.investor || "",
    amount_raised: deal.amount_raised != null ? deal.amount_raised : null,
    end_market: deal.end_market || "Other",
    description: deal.description || "",
    source_url: deal.source_url || "",
    status: null,
    comments: "",
  };
}
