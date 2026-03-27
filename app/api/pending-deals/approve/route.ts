import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { notifyFirmSlack } from "@/lib/scraper";

// POST /api/pending-deals/approve
// Body: { ids: string[] } or { all: true }
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Fetch the pending deals to approve
  let query = supabase.from("pending_deals").select("*");

  if (body.all === true) {
    // Approve all — no filter needed
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    query = query.in("id", body.ids);
  } else {
    return NextResponse.json(
      { error: "Provide 'ids' array or 'all: true'" },
      { status: 400 }
    );
  }

  const { data: pendingDeals, error: fetchError } = await query;

  if (fetchError) {
    console.error("Approve (fetch) error:", fetchError.message);
    return NextResponse.json({ error: "Failed to fetch pending deals" }, { status: 500 });
  }

  if (!pendingDeals || pendingDeals.length === 0) {
    return NextResponse.json({ approved: 0, message: "No pending deals to approve" });
  }

  // Insert into the main deals table
  const dealRows = pendingDeals.map((pd) => ({
    id: crypto.randomUUID(),
    date: pd.date,
    company_name: pd.company_name,
    investor: pd.investor,
    amount_raised: pd.amount_raised,
    end_market: pd.end_market,
    description: pd.description,
    source_url: pd.source_url,
    status: null,
    comments: "",
    updated_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase.from("deals").insert(dealRows);

  if (insertError) {
    console.error("Approve (insert) error:", insertError.message);
    return NextResponse.json({ error: "Failed to insert approved deals" }, { status: 500 });
  }

  // Remove from pending_deals
  const pendingIds = pendingDeals.map((pd) => pd.id);
  const { error: deleteError } = await supabase
    .from("pending_deals")
    .delete()
    .in("id", pendingIds);

  if (deleteError) {
    console.error("Approve (delete pending) error:", deleteError.message);
    // Non-fatal — deals are already in the main table
  }

  // Notify the firm Slack channel
  try {
    await notifyFirmSlack(
      pendingDeals.map((pd) => ({
        company_name: pd.company_name as string,
        investor: pd.investor as string,
        amount_raised: pd.amount_raised as number | null,
        end_market: pd.end_market as string,
        description: pd.description as string,
        source_url: pd.source_url as string,
      }))
    );
  } catch (e) {
    console.error("Slack notification after approval failed:", e);
    // Non-fatal
  }

  return NextResponse.json({
    approved: pendingDeals.length,
    message: `Approved ${pendingDeals.length} deal(s)`,
  });
}
