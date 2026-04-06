import { NextResponse } from "next/server";

// POST /api/deals/refresh — trigger GitHub Actions scraper workflow
export async function POST() {
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    return NextResponse.json(
      { success: false, message: "GITHUB_PAT not configured" },
      { status: 500 }
    );
  }

  try {
    const resp = await fetch(
      "https://api.github.com/repos/mjholmes17/deal-tracker/actions/workflows/scraper.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ ref: "master" }),
      }
    );

    if (!resp.ok) {
      const body = await resp.text();
      console.error("GitHub Actions dispatch failed:", resp.status, body);
      return NextResponse.json(
        { success: false, message: "Failed to trigger scraper" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Scraper triggered — you'll be notified on Slack when complete.",
    });
  } catch (e) {
    console.error("GitHub Actions dispatch error:", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { success: false, message: "Failed to trigger scraper" },
      { status: 500 }
    );
  }
}
