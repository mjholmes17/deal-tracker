"""
Wavecrest Deal Tracker — Daily Deal Scraper

Scrapes news sources and competitor firm websites for growth equity deal
announcements, extracts structured data using Claude, deduplicates against
existing deals, and inserts new ones into Supabase.

Usage:
    python scripts/scraper.py              # Run full scrape
    python scripts/scraper.py --dry-run    # Extract but don't insert
"""

import json
import os
import sys
import time
import uuid
from datetime import datetime, timedelta

import anthropic
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from thefuzz import fuzz

from config import COMPETITOR_FIRM_URLS, END_MARKETS, NEWS_SOURCES

# ── Setup ─────────────────────────────────────────────────────────────────

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# ── Web Scraping ──────────────────────────────────────────────────────────


def fetch_page(url: str, timeout: int = 15) -> str | None:
    """Fetch a URL and return its text content, or None on failure."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"  [WARN] Failed to fetch {url}: {e}")
        return None


def extract_text_from_html(html: str, max_chars: int = 15000) -> str:
    """Parse HTML and return cleaned text, truncated to max_chars."""
    soup = BeautifulSoup(html, "html.parser")

    # Remove scripts, styles, navs, footers
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)

    # Collapse whitespace
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    text = "\n".join(lines)

    return text[:max_chars]


def scrape_source(name: str, url: str) -> str | None:
    """Scrape a single source and return its text content."""
    print(f"  Scraping: {name}")
    html = fetch_page(url)
    if not html:
        return None
    return extract_text_from_html(html)


def scrape_all_sources() -> list[dict]:
    """Scrape all news sources and competitor firm pages."""
    results = []

    print("\n=== Scraping news sources ===")
    for source in NEWS_SOURCES:
        text = scrape_source(source["name"], source["url"])
        if text:
            results.append({
                "source_name": source["name"],
                "source_url": source["url"],
                "text": text,
            })
        time.sleep(1)  # Be polite

    print("\n=== Scraping competitor firm websites ===")
    for firm_name, firm_url in COMPETITOR_FIRM_URLS:
        text = scrape_source(firm_name, firm_url)
        if text:
            results.append({
                "source_name": firm_name,
                "source_url": firm_url,
                "text": text,
            })
        time.sleep(0.5)

    return results


# ── Claude Extraction ─────────────────────────────────────────────────────

EXTRACTION_PROMPT = """You are a growth equity deal extraction assistant. Analyze the following text scraped from a news source or investment firm website and extract any growth equity / private equity deals announced.

For EACH deal found, extract:
- company_name: The portfolio company receiving investment
- investor: The PE/growth equity firm investing (must be one of the tracked firms if from a firm page)
- amount_raised: Dollar amount in USD (number only, no formatting). Use null if undisclosed.
- end_market: Classify into exactly one of these categories: {end_markets}
- description: 1-2 sentence summary of what the company does
- date: The announcement date in YYYY-MM-DD format. Use today's date if not specified.
- source_url: The URL this was scraped from (provided below)

IMPORTANT RULES:
- Only extract GROWTH EQUITY or PRIVATE EQUITY deals (not venture/seed, not M&A/acquisitions, not debt)
- The investor must be a PE/growth equity firm, not a strategic acquirer
- Skip deals older than 30 days
- Skip duplicate mentions of the same deal
- If no relevant deals are found, return an empty array

Source name: {source_name}
Source URL: {source_url}
Today's date: {today}

Respond with ONLY a JSON array of deal objects. No markdown, no explanation.
Example: [{{"company_name": "Acme Corp", "investor": "Summit Partners", "amount_raised": 50000000, "end_market": "FinTech", "description": "Acme Corp provides...", "date": "2026-02-20", "source_url": "https://..."}}]

If no deals found, respond with: []

--- SCRAPED TEXT ---
{text}
"""


def extract_deals_from_text(source_name: str, source_url: str, text: str) -> list[dict]:
    """Use Claude to extract structured deal data from scraped text."""
    prompt = EXTRACTION_PROMPT.format(
        end_markets=", ".join(END_MARKETS),
        source_name=source_name,
        source_url=source_url,
        today=datetime.now().strftime("%Y-%m-%d"),
        text=text,
    )

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        content = response.content[0].text.strip()

        # Parse JSON — handle potential markdown code blocks
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        deals = json.loads(content)
        if not isinstance(deals, list):
            return []
        return deals

    except json.JSONDecodeError as e:
        print(f"  [WARN] Failed to parse Claude response for {source_name}: {e}")
        return []
    except Exception as e:
        print(f"  [ERROR] Claude API error for {source_name}: {e}")
        return []


# ── Deduplication ─────────────────────────────────────────────────────────


def get_existing_deals() -> list[dict]:
    """Fetch recent deals from Supabase for dedup comparison."""
    cutoff = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    url = (
        f"{SUPABASE_URL}/rest/v1/deals"
        f"?select=id,company_name,investor,date"
        f"&deleted_at=is.null"
        f"&date=gte.{cutoff}"
    )
    resp = requests.get(url, headers=SUPABASE_HEADERS)
    if resp.status_code != 200:
        print(f"  [WARN] Failed to fetch existing deals: {resp.text}")
        return []
    return resp.json()


def is_duplicate(deal: dict, existing: list[dict], threshold: int = 80) -> bool:
    """Check if a deal is a duplicate using fuzzy matching on company + investor."""
    deal_date = deal.get("date", "")

    for ex in existing:
        # Company name fuzzy match
        name_score = fuzz.ratio(
            deal.get("company_name", "").lower(),
            ex.get("company_name", "").lower(),
        )

        # Investor fuzzy match
        investor_score = fuzz.ratio(
            deal.get("investor", "").lower(),
            ex.get("investor", "").lower(),
        )

        # Date within 7-day window
        try:
            deal_dt = datetime.strptime(deal_date, "%Y-%m-%d")
            ex_dt = datetime.strptime(ex.get("date", ""), "%Y-%m-%d")
            within_window = abs((deal_dt - ex_dt).days) <= 7
        except ValueError:
            within_window = True  # Assume overlap if dates can't be parsed

        if name_score >= threshold and investor_score >= threshold and within_window:
            return True

    return False


# ── Supabase Insert ───────────────────────────────────────────────────────


def insert_deals(deals: list[dict]) -> int:
    """Insert new deals into Supabase. Returns count of inserted deals."""
    if not deals:
        return 0

    rows = []
    for d in deals:
        rows.append({
            "id": str(uuid.uuid4()),
            "date": d.get("date", datetime.now().strftime("%Y-%m-%d")),
            "company_name": d.get("company_name", ""),
            "investor": d.get("investor", ""),
            "amount_raised": d.get("amount_raised"),
            "end_market": d.get("end_market", "Other"),
            "description": d.get("description", ""),
            "source_url": d.get("source_url", ""),
            "status": None,
            "comments": "",
            "updated_at": datetime.now().isoformat(),
        })

    url = f"{SUPABASE_URL}/rest/v1/deals"
    resp = requests.post(url, headers=SUPABASE_HEADERS, json=rows)

    if resp.status_code in (200, 201):
        return len(rows)
    else:
        print(f"  [ERROR] Insert failed: {resp.status_code} — {resp.text}")
        return 0


# ── Main ──────────────────────────────────────────────────────────────────


def main():
    dry_run = "--dry-run" in sys.argv
    start = time.time()

    print("=" * 60)
    print("  Wavecrest Deal Tracker — Daily Scraper")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print("=" * 60)

    # 1. Scrape all sources
    scraped = scrape_all_sources()
    print(f"\n>>> Scraped {len(scraped)} sources successfully")

    # 2. Extract deals using Claude
    print("\n=== Extracting deals with Claude ===")
    all_extracted = []
    for source in scraped:
        print(f"  Extracting from: {source['source_name']}")
        deals = extract_deals_from_text(
            source["source_name"],
            source["source_url"],
            source["text"],
        )
        if deals:
            print(f"    Found {len(deals)} deal(s)")
            all_extracted.extend(deals)
        else:
            print(f"    No deals found")

    print(f"\n>>> Total deals extracted: {len(all_extracted)}")

    if not all_extracted:
        print("\nNo deals to process. Done.")
        return

    # 3. Deduplicate
    print("\n=== Deduplicating against existing deals ===")
    existing = get_existing_deals()
    print(f"  Existing deals in last 30 days: {len(existing)}")

    new_deals = []
    for deal in all_extracted:
        if is_duplicate(deal, existing):
            print(f"  [SKIP] Duplicate: {deal.get('company_name')} / {deal.get('investor')}")
        else:
            new_deals.append(deal)
            # Add to existing list so we don't insert the same deal twice from different sources
            existing.append(deal)

    print(f"\n>>> New unique deals: {len(new_deals)}")

    # 4. Insert (or print in dry-run mode)
    if dry_run:
        print("\n=== DRY RUN — Deals that would be inserted ===")
        for d in new_deals:
            print(f"  • {d.get('company_name')} | {d.get('investor')} | "
                  f"${d.get('amount_raised', 'undisclosed')} | {d.get('end_market')}")
            print(f"    {d.get('description', '')[:100]}")
    else:
        print("\n=== Inserting new deals into Supabase ===")
        inserted = insert_deals(new_deals)
        print(f"  Inserted {inserted} deal(s)")

    elapsed = round(time.time() - start, 1)
    print(f"\n{'=' * 60}")
    print(f"  Done in {elapsed}s — {len(new_deals)} new deal(s)")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
