/**
 * Web scraping: fetch pages and extract clean text using cheerio.
 */

import * as cheerio from "cheerio";
import { ScraperSource } from "./config";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ScrapeResult {
  source_name: string;
  source_url: string;
  text: string;
}

async function fetchPage(url: string, timeoutMs = 15_000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const resp = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      console.log(`  [WARN] HTTP ${resp.status} for ${url}`);
      return null;
    }
    return await resp.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  [WARN] Failed to fetch ${url}: ${msg}`);
    return null;
  }
}

function extractTextFromHtml(html: string, maxChars = 15_000): string {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, nav, footer, header, aside").remove();

  const text = $.text();

  // Collapse whitespace: split into lines, trim each, drop empty
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.join("\n").slice(0, maxChars);
}

/**
 * Scrape all sources in parallel batches.
 * @param sources - list of sources to scrape
 * @param batchSize - how many concurrent fetches per batch (default 10)
 */
export async function scrapeAllSources(
  sources: ScraperSource[],
  batchSize = 10
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (source) => {
        console.log(`  Scraping: ${source.name}`);
        const html = await fetchPage(source.url);
        if (!html) return null;
        const text = extractTextFromHtml(html);
        if (!text || text.length < 50) return null;
        return {
          source_name: source.name,
          source_url: source.url,
          text,
        };
      })
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    }
  }

  return results;
}
