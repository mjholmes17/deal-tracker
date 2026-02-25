/**
 * Fuzzy deduplication: compare extracted deals against existing ones.
 */

import { ratio } from "fuzzball";
import { ExtractedDeal } from "./extract";

export interface ExistingDeal {
  id: string;
  company_name: string;
  investor: string;
  date: string;
}

/**
 * Check if a deal is a duplicate of any existing deal.
 * Uses fuzzy matching on company name + investor, plus a 7-day date window.
 */
function isDuplicate(
  deal: ExtractedDeal,
  existing: ExistingDeal[],
  threshold = 80
): boolean {
  const dealDate = deal.date || "";

  for (const ex of existing) {
    const nameScore = ratio(
      (deal.company_name || "").toLowerCase(),
      (ex.company_name || "").toLowerCase()
    );

    const investorScore = ratio(
      (deal.investor || "").toLowerCase(),
      (ex.investor || "").toLowerCase()
    );

    // Date within 7-day window
    let withinWindow = true;
    try {
      const dealDt = new Date(dealDate);
      const exDt = new Date(ex.date);
      const diffDays = Math.abs(
        (dealDt.getTime() - exDt.getTime()) / (1000 * 60 * 60 * 24)
      );
      withinWindow = diffDays <= 7;
    } catch {
      withinWindow = true; // Assume overlap if dates can't be parsed
    }

    if (nameScore >= threshold && investorScore >= threshold && withinWindow) {
      return true;
    }
  }

  return false;
}

/**
 * Filter out duplicate deals from the extracted list.
 * Also prevents intra-batch duplicates by adding each new deal to the existing list.
 */
export function deduplicateDeals(
  extracted: ExtractedDeal[],
  existing: ExistingDeal[]
): { newDeals: ExtractedDeal[]; skipped: number } {
  // Work with a mutable copy so we can add new deals for intra-batch dedup
  const knownDeals: ExistingDeal[] = [...existing];
  const newDeals: ExtractedDeal[] = [];
  let skipped = 0;

  for (const deal of extracted) {
    if (isDuplicate(deal, knownDeals)) {
      console.log(
        `  [SKIP] Duplicate: ${deal.company_name} / ${deal.investor}`
      );
      skipped++;
    } else {
      newDeals.push(deal);
      // Add to known list to prevent intra-batch duplicates
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
