/**
 * Fuzzy deduplication: compare extracted deals against existing ones.
 *
 * Uses token_set_ratio for investor matching to handle name variations
 * like "Insight" vs "Insight Partners" or "Lead Edge" vs "Lead Edge Capital".
 */

import { ratio, token_set_ratio } from "fuzzball";
import { ExtractedDeal } from "./extract";

export interface ExistingDeal {
  id: string;
  company_name: string;
  investor: string;
  date: string;
}

/**
 * Check if a deal is a duplicate of any existing deal.
 *
 * Company name: standard ratio (>= 80)
 * Investor: token_set_ratio (>= 80) — handles "Insight" vs "Insight Partners"
 * Date: 90-day window — firm websites keep deals listed for months and Claude
 *   sometimes assigns today's date when the original date isn't in the text
 */
function isDuplicate(
  deal: ExtractedDeal,
  existing: ExistingDeal[]
): boolean {
  const dealName = (deal.company_name || "").toLowerCase();
  const dealInvestor = (deal.investor || "").toLowerCase();
  const dealDate = deal.date || "";

  for (const ex of existing) {
    const nameScore = ratio(
      dealName,
      (ex.company_name || "").toLowerCase()
    );

    // token_set_ratio handles extra words:
    // "Insight" vs "Insight Partners" → 100
    // "Lead Edge" vs "Lead Edge Capital" → 100
    // "Frontier Growth" vs "Frontier Growth Partners" → 100
    const investorScore = token_set_ratio(
      dealInvestor,
      (ex.investor || "").toLowerCase()
    );

    // Date within 14-day window
    let withinWindow = true;
    try {
      const dealDt = new Date(dealDate);
      const exDt = new Date(ex.date);
      const diffDays = Math.abs(
        (dealDt.getTime() - exDt.getTime()) / (1000 * 60 * 60 * 24)
      );
      withinWindow = diffDays <= 90;
    } catch {
      withinWindow = true; // Assume overlap if dates can't be parsed
    }

    if (nameScore >= 80 && investorScore >= 80 && withinWindow) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a deal is invalid (e.g. a firm "investing in" itself).
 */
function isInvalidDeal(deal: ExtractedDeal): boolean {
  const name = (deal.company_name || "").toLowerCase();
  const investor = (deal.investor || "").toLowerCase();

  if (!name || !investor) return true;

  // Reject if company name and investor are too similar (firm investing in itself)
  if (token_set_ratio(name, investor) >= 80) {
    console.log(
      `  [SKIP] Invalid: "${deal.company_name}" matches investor "${deal.investor}"`
    );
    return true;
  }

  return false;
}

/**
 * Filter out duplicate and invalid deals from the extracted list.
 * Also prevents intra-batch duplicates by adding each new deal to the existing list.
 */
export function deduplicateDeals(
  extracted: ExtractedDeal[],
  existing: ExistingDeal[]
): { newDeals: ExtractedDeal[]; skipped: number } {
  const knownDeals: ExistingDeal[] = [...existing];
  const newDeals: ExtractedDeal[] = [];
  let skipped = 0;

  for (const deal of extracted) {
    if (isInvalidDeal(deal)) {
      skipped++;
    } else if (isDuplicate(deal, knownDeals)) {
      console.log(
        `  [SKIP] Duplicate: ${deal.company_name} / ${deal.investor}`
      );
      skipped++;
    } else {
      newDeals.push(deal);
      knownDeals.push({
        id: "",
        company_name: deal.company_name,
        investor: deal.investor,
        date: deal.date,
      });
    }
  }

  return { newDeals, skipped };
}
