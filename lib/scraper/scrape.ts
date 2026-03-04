/**
 * Web scraping: fetch pages and extract clean text using cheerio.
 * Also supports RSS feed parsing for sources with type "rss".
 */

import * as cheerio from "cheerio";
import RSSParser from "rss-parser";
import { ScraperSource } from "./config";

const rssParser = new RSSParser({
  timeout: 15_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
});

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

async function parseRssFeed(
  source: ScraperSource,
  maxChars = 15_000
): Promise<ScrapeResult | null> {
  try {
    const feed = await rssParser.parseURL(source.url);
    if (!feed.items || feed.items.length === 0) {
      console.log(`  [WARN] No items in RSS feed: ${source.name}`);
      return null;
    }

    const lines: string[] = [];
    let charCount = 0;

    for (let i = 0; i < feed.items.length; i++) {
      const item = feed.items[i];
      const date = item.isoDate
        ? item.isoDate.slice(0, 10)
        : item.pubDate ?? "unknown";
      const block = [
        `--- ITEM ${i + 1} ---`,
        `Title: ${item.title ?? ""}`,
        `Date: ${date}`,
        `Link: ${item.link ?? ""}`,
        `Description: ${(item.contentSnippet ?? item.content ?? "").slice(0, 1000)}`,
      ].join("\n");

      if (charCount + block.length > maxChars) break;
      lines.push(block);
      charCount += block.length;
    }

    const text = lines.join("\n\n");
    if (text.length < 50) return null;

    return {
      source_name: source.name,
      source_url: source.url,
      text,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  [WARN] Failed to parse RSS ${source.url}: ${msg}`);
    return null;
  }
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
        if (source.type === "rss") {
          return parseRssFeed(source);
        }
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
