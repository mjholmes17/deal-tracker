/**
 * Scraper orchestrator: runs the full scrape → extract → dedup → stage pipeline.
 *
 * Deals land in `pending_deals` for manual review. Once approved via the
 * /review page, they move to `deals` and the firm Slack channel is notified.
 */

import { prisma } from "@/lib/db";
import { ALL_SOURCES } from "./config";
import { scrapeAllSources } from "./scrape";
import { extractDealsFromSources, ExtractedDeal } from "./extract";
import { deduplicateDeals, ExistingDeal, filterToTrackedCompetitors } from "./dedup";

export interface ScraperResult {
  success: boolean;
  sourcesScraped: number;
  dealsExtracted: number;
  dealsPending: number;
  errors: string[];
  durationMs: number;
}

/**
 * Run the full scraper pipeline:
 * 1. Scrape all sources (parallel batches of 10)
 * 2. Extract deals via Claude (parallel batches of 5)
 * 3. Filter stale + non-competitor deals
 * 4. Dedup against deals AND pending_deals
 * 5. Insert into pending_deals for review
 * 6. Notify #deal-review Slack channel
 */
export async function runScraper(): Promise<ScraperResult> {
  const start = Date.now();
  const errors: string[] = [];

  console.log("=".repeat(60));
  console.log("  Growth Equity Deal Tracker — Scraper (Mon/Wed/Fri)");
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

  // Filter out deals with dates older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentDeals = allExtracted.filter((deal) => {
    if (!deal.date) return false;
    const dealDate = new Date(deal.date);
    if (isNaN(dealDate.getTime()) || dealDate < sevenDaysAgo) {
      console.log(`  [SKIP] Too old: ${deal.company_name} (${deal.date})`);
      return false;
    }
    return true;
  });
  const staleSkipped = allExtracted.length - recentDeals.length;
  if (staleSkipped > 0) {
    console.log(`>>> Filtered out ${staleSkipped} stale deal(s) older than 7 days`);
  }
  // Filter to only deals from tracked competitor firms
  console.log("\n=== Filtering to tracked competitors ===");
  const { tracked, removed: competitorRemoved } =
    filterToTrackedCompetitors(recentDeals);
  if (competitorRemoved > 0) {
    console.log(
      `>>> Filtered out ${competitorRemoved} deal(s) from non-tracked investors`
    );
  }
  const allFiltered = tracked;

  if (allFiltered.length === 0) {
    console.log("\nNo deals to process. Done.");
    return {
      success: true,
      sourcesScraped: scraped.length,
      dealsExtracted: allExtracted.length,
      dealsPending: 0,
      errors,
      durationMs: Date.now() - start,
    };
  }

  // 3. Fetch all deals from BOTH tables for dedup — including soft-deleted
  //    ones so manually deleted deals don't get re-inserted by the scraper
  console.log("\n=== Deduplicating against existing + pending deals ===");

  const [existingDealRows, existingPendingRows] = await Promise.all([
    prisma.deal.findMany({
      select: { id: true, company_name: true, investor: true, date: true },
    }),
    prisma.pendingDeal.findMany({
      select: { id: true, company_name: true, investor: true, date: true },
    }),
  ]);

  const existing: ExistingDeal[] = [
    ...existingDealRows,
    ...existingPendingRows,
  ].map((row) => ({
    id: row.id,
    company_name: row.company_name,
    investor: row.investor,
    date:
      row.date instanceof Date
        ? row.date.toISOString().slice(0, 10)
        : String(row.date),
  }));

  console.log(`  Existing deals in DB (for dedup): ${existing.length}`);

  // 4. Deduplicate
  const { newDeals, skipped } = deduplicateDeals(allFiltered, existing);
  console.log(`\n>>> New unique deals: ${newDeals.length} (skipped ${skipped} duplicates)`);

  // 5. Insert into pending_deals for review
  let insertedCount = 0;
  if (newDeals.length > 0) {
    console.log("\n=== Inserting new deals into pending_deals ===");
    const batchId = crypto.randomUUID();
    try {
      const rows = newDeals.map((deal) => pendingDealToRow(deal, batchId));
      const result = await prisma.pendingDeal.createMany({ data: rows });
      insertedCount = result.count;
      console.log(`  Inserted ${insertedCount} pending deal(s) (batch: ${batchId})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  [ERROR] Insert failed: ${msg}`);
      errors.push(`Insert failed: ${msg}`);
    }
  }

  // 6. Notify #deal-review Slack channel
  if (insertedCount > 0) {
    await notifyReviewSlack(newDeals.slice(0, insertedCount), insertedCount);
  }

  const durationMs = Date.now() - start;

  // 7. Log scan completion
  try {
    await prisma.scanLog.create({
      data: {
        deals_found: insertedCount,
        duration_ms: durationMs,
      },
    });
  } catch (e) {
    console.log(`  [WARN] Failed to log scan: ${e instanceof Error ? e.message : e}`);
  }
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Done in ${(durationMs / 1000).toFixed(1)}s — ${insertedCount} deal(s) pending review`);
  console.log("=".repeat(60));

  return {
    success: true,
    sourcesScraped: scraped.length,
    dealsExtracted: allExtracted.length,
    dealsPending: insertedCount,
    errors,
    durationMs,
  };
}

/**
 * Notify the private #deal-review Slack channel that new deals need review.
 */
async function notifyReviewSlack(deals: ExtractedDeal[], count: number) {
  const webhookUrl = process.env.SLACK_REVIEW_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("  [SKIP] SLACK_REVIEW_WEBHOOK_URL not set, skipping review notification");
    return;
  }

  const dealLines = deals.slice(0, 10).flatMap((d) => {
    const amount = d.amount_raised
      ? `$${(d.amount_raised / 1_000_000).toFixed(0)}M`
      : "undisclosed";
    return [`\u2022 *${d.company_name}* \u2014 ${d.investor} \u2014 ${amount} \u2014 ${d.end_market}`];
  });

  if (count > 10) {
    dealLines.push(`_...and ${count - 10} more_`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://growthequitydeals.com";

  const text = [
    `\ud83d\udd0d *${count} new deal${count === 1 ? "" : "s"} pending review*`,
    "",
    ...dealLines,
    "",
    `<${appUrl}/review|Review and approve \u2192>`,
  ].join("\n");

  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (resp.ok) {
      console.log("  Review Slack notification sent");
    } else {
      console.log(`  [WARN] Review Slack notification failed: ${resp.status}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  [WARN] Review Slack notification error: ${msg}`);
  }
}

/**
 * Notify the firm-wide Slack channel about approved deals.
 * Exported so the approval API route can call it after deals are approved.
 */
export async function notifyFirmSlack(
  deals: {
    company_name: string;
    investor: string;
    amount_raised: number | null;
    end_market: string;
    description: string;
    source_url: string;
  }[]
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("  [SKIP] SLACK_WEBHOOK_URL not set, skipping notification");
    return;
  }

  const dealLines = deals.flatMap((d) => {
    const amount = d.amount_raised
      ? `$${(d.amount_raised / 1_000_000).toFixed(0)}M`
      : "undisclosed";
    const source = d.source_url ? ` (<${d.source_url}|source>)` : "";
    const lines = [`\u2022 *${d.company_name}* \u2014 ${d.investor} \u2014 ${amount} \u2014 ${d.end_market}${source}`];
    if (d.description) {
      lines.push(`   _${d.description}_`);
    }
    return lines;
  });

  const text = [
    `\ud83d\udcca *${deals.length} new deal${deals.length === 1 ? "" : "s"} found*`,
    "",
    ...dealLines,
    "",
    `<https://growthequitydeals.com|View all deals \u2192>`,
  ].join("\n");

  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (resp.ok) {
      console.log("  Slack notification sent");
    } else {
      console.log(`  [WARN] Slack notification failed: ${resp.status}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  [WARN] Slack notification error: ${msg}`);
  }
}

function pendingDealToRow(deal: ExtractedDeal, batchId: string) {
  return {
    date: new Date(deal.date || new Date().toISOString().slice(0, 10)),
    company_name: deal.company_name || "",
    investor: deal.investor || "",
    amount_raised: deal.amount_raised != null ? deal.amount_raised : null,
    end_market: deal.end_market || "Other",
    description: deal.description || "",
    source_url: deal.source_url || "",
    batch_id: batchId,
  };
}
