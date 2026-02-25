import { DealTable } from "@/components/deal-table";
import { LogoutButton } from "@/components/logout-button";
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

  const newCount = deals.filter((d) => d.status === null).length;
  const reviewedCount = deals.filter((d) => d.status !== null).length;
  const missedCount = deals.filter((d) => d.status === "Did Not See").length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <header className="bg-brand-900 text-white">
        <div className="max-w-[1700px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-lg tracking-tight shadow-sm">
              W
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight leading-tight">
                Wavecrest Deal Tracker
              </h1>
              <p className="text-xs text-brand-300 leading-tight">
                Competitive deal intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-brand-300 bg-brand-800/60 rounded-full px-3 py-1.5">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full" />
              Last scan: today 9:00 AM
            </div>
            <button className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
              + Add Deal
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-white border-b border-border-default">
        <div className="max-w-[1700px] mx-auto px-8 py-3 flex items-center gap-6">
          <Stat label="Total Deals" value={String(deals.length)} />
          <div className="w-px h-5 bg-border-default" />
          <Stat label="New" value={String(newCount)} accent />
          <div className="w-px h-5 bg-border-default" />
          <Stat label="Reviewed" value={String(reviewedCount)} />
          <div className="w-px h-5 bg-border-default" />
          <Stat label="Did Not See" value={String(missedCount)} warn />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-8 py-6">
        <DealTable initialDeals={deals} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border-default bg-white">
        <div className="max-w-[1700px] mx-auto px-8 py-3 text-xs text-text-muted">
          Wavecrest Growth Partners &middot; Internal use only
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted font-medium">{label}</span>
      <span
        className={`text-sm font-semibold ${
          accent ? "text-brand-600" : warn ? "text-rose-600" : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
