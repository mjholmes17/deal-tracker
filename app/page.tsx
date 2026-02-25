import { DealPage } from "@/components/deal-page";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/db";
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

async function getLastScanAt(): Promise<string | null> {
  try {
    const latest = await prisma.scanLog.findFirst({
      orderBy: { completed_at: "desc" },
      select: { completed_at: true },
    });
    return latest?.completed_at?.toISOString() ?? null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const [deals, lastScanAt] = await Promise.all([getDeals(), getLastScanAt()]);

  return (
    <div className="min-h-screen flex flex-col">
      <DealPage initialDeals={deals} lastScanAt={lastScanAt} />

      {/* Footer */}
      <footer className="border-t border-border-default bg-white">
        <div className="max-w-[1700px] mx-auto px-8 py-3 text-xs text-text-muted">
          Growth Equity Deal Tracker &middot; Internal use only
        </div>
      </footer>
    </div>
  );
}
