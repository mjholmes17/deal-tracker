import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/pending-deals/reject
// Body: { ids: string[] }
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json(
      { error: "Provide 'ids' array" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("pending_deals")
    .update({ rejected_at: new Date().toISOString() })
    .in("id", body.ids);

  if (error) {
    console.error("Reject error:", error.message);
    return NextResponse.json({ error: "Failed to reject deals" }, { status: 500 });
  }

  return NextResponse.json({
    rejected: body.ids.length,
    message: `Rejected ${body.ids.length} deal(s)`,
  });
}
