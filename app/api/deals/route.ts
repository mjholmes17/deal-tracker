import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/deals — list all active deals
export async function GET() {
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/deals — create a new deal
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("deals")
    .insert({
      id: crypto.randomUUID(),
      date: body.date,
      company_name: body.company_name,
      investor: body.investor,
      amount_raised: body.amount_raised ?? null,
      end_market: body.end_market ?? "",
      description: body.description ?? "",
      source_url: body.source_url ?? "",
      status: body.status ?? null,
      comments: body.comments ?? "",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
