import { DealPage } from "@/components/deal-page";
import { supabase } from "@/lib/supabase";
import { Deal } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getDeals(): Promise<Deal[]> {
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) {
    console.error("Failed to fetch deals:", error.message);
    return [];
  }

  return (data ?? []).map((d) => ({
    ...d,
    amount_raised: d.amount_raised ? Number(d.amount_raised) : null,
  }));
}

export default async function Home() {
  const deals = await getDeals();

  return (
    <div className="min-h-screen flex flex-col">
      <DealPage initialDeals={deals} />

      {/* Footer */}
      <footer className="border-t border-border-default bg-white">
        <div className="max-w-[1700px] mx-auto px-8 py-3 text-xs text-text-muted">
          Wavecrest Growth Partners &middot; Internal use only
        </div>
      </footer>
    </div>
  );
}
