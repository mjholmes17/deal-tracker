import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/pending-deals — list pending deals awaiting review (excludes rejected)
export async function GET() {
  const { data, error } = await supabase
    .from("pending_deals")
    .select("*")
    .is("rejected_at", null)
    .order("scraped_at", { ascending: false });

  if (error) {
    console.error("GET /api/pending-deals error:", error.message);
    return NextResponse.json({ error: "Failed to fetch pending deals" }, { status: 500 });
  }

  return NextResponse.json(data);
}
