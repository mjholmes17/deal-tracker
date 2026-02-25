import { NextRequest, NextResponse } from "next/server";
import { runScraper } from "@/lib/scraper";

// Allow up to 5 minutes for the scraper to complete (Vercel Pro)
export const maxDuration = 300;

// GET /api/deals/refresh — Vercel cron trigger (authenticated via CRON_SECRET)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runScraperAndRespond();
}

// POST /api/deals/refresh — manual trigger from UI (session-authenticated via middleware)
export async function POST() {
  return runScraperAndRespond();
}

async function runScraperAndRespond(): Promise<NextResponse> {
  try {
    const result = await runScraper();

    return NextResponse.json({
      success: result.success,
      newDeals: result.dealsInserted,
      message: `Scraper completed. ${result.dealsInserted} new deal(s) found.`,
      details: {
        sourcesScraped: result.sourcesScraped,
        dealsExtracted: result.dealsExtracted,
        errors: result.errors,
        durationMs: result.durationMs,
      },
    });
  } catch (e) {
    console.error("Scraper failed:", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      {
        success: false,
        message: "Scraper failed. Check server logs.",
      },
      { status: 500 }
    );
  }
}
