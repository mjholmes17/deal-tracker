import { ReviewPage } from "@/components/review-page";
import { supabase } from "@/lib/supabase";
import { PendingDeal } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPendingDeals(): Promise<PendingDeal[]> {
  const { data, error } = await supabase
    .from("pending_deals")
    .select("*")
    .is("rejected_at", null)
    .order("scraped_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch pending deals:", error.message);
    return [];
  }

  return (data ?? []).map((d) => ({
    ...d,
    amount_raised: d.amount_raised ? Number(d.amount_raised) : null,
  }));
}

export default async function Review() {
  const pendingDeals = await getPendingDeals();

  return (
    <div className="min-h-screen flex flex-col">
      <ReviewPage initialDeals={pendingDeals} />

      <footer className="border-t border-border-default bg-white">
        <div className="max-w-[1700px] mx-auto px-8 py-3 text-xs text-text-muted">
          Growth Equity Deal Tracker &middot; Deal Review
        </div>
      </footer>
    </div>
  );
}
