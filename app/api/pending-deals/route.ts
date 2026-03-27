import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/pending-deals — list all pending deals awaiting review
export async function GET() {
  const { data, error } = await supabase
    .from("pending_deals")
    .select("*")
    .order("scraped_at", { ascending: false });

  if (error) {
    console.error("GET /api/pending-deals error:", error.message);
    return NextResponse.json({ error: "Failed to fetch pending deals" }, { status: 500 });
  }

  return NextResponse.json(data);
}
