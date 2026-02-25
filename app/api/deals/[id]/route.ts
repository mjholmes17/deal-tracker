import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ALLOWED_PATCH_FIELDS = new Set([
  "date",
  "company_name",
  "investor",
  "amount_raised",
  "end_market",
  "description",
  "source_url",
  "status",
  "comments",
  "deleted_at",
]);

// PATCH /api/deals/[id] — update a deal field
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Only allow known fields — strip everything else
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_PATCH_FIELDS.has(key)) {
      sanitized[key] = body[key];
    }
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("deals")
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("PATCH /api/deals/[id] error:", error.message);
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/deals/[id] — soft delete a deal
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from("deals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("DELETE /api/deals/[id] error:", error.message);
    return NextResponse.json({ error: "Failed to delete deal" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
