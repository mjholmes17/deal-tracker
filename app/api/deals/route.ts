import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_STATUSES = new Set(["Saw and Passed", "Did Not See", "Irrelevant"]);
const MAX_TEXT_LENGTH = 5000;
const MAX_URL_LENGTH = 2000;

// GET /api/deals — list all active deals
export async function GET() {
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .is("deleted_at", null)
    .order("date", { ascending: false });

  if (error) {
    console.error("GET /api/deals error:", error.message);
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/deals — create a new deal
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validate required fields
  const errors: string[] = [];

  if (!body.company_name || typeof body.company_name !== "string" || body.company_name.trim().length === 0) {
    errors.push("company_name is required");
  } else if (body.company_name.length > 255) {
    errors.push("company_name must be 255 characters or fewer");
  }

  if (!body.investor || typeof body.investor !== "string" || body.investor.trim().length === 0) {
    errors.push("investor is required");
  } else if (body.investor.length > 255) {
    errors.push("investor must be 255 characters or fewer");
  }

  if (!body.date || typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    errors.push("date is required and must be YYYY-MM-DD format");
  }

  // Validate optional fields
  if (body.amount_raised !== undefined && body.amount_raised !== null) {
    const amount = Number(body.amount_raised);
    if (isNaN(amount) || amount < 0) {
      errors.push("amount_raised must be a non-negative number");
    }
  }

  if (body.status !== undefined && body.status !== null && !VALID_STATUSES.has(body.status)) {
    errors.push("status must be one of: Saw and Passed, Did Not See, Irrelevant");
  }

  if (body.description && typeof body.description === "string" && body.description.length > MAX_TEXT_LENGTH) {
    errors.push(`description must be ${MAX_TEXT_LENGTH} characters or fewer`);
  }

  if (body.comments && typeof body.comments === "string" && body.comments.length > MAX_TEXT_LENGTH) {
    errors.push(`comments must be ${MAX_TEXT_LENGTH} characters or fewer`);
  }

  if (body.source_url && typeof body.source_url === "string" && body.source_url.length > MAX_URL_LENGTH) {
    errors.push(`source_url must be ${MAX_URL_LENGTH} characters or fewer`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("deals")
    .insert({
      id: crypto.randomUUID(),
      date: body.date,
      company_name: body.company_name.trim(),
      investor: body.investor.trim(),
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
    console.error("POST /api/deals error:", error.message);
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
