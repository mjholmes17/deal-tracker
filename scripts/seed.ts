import { createClient } from "@supabase/supabase-js";
import { SAMPLE_DEALS } from "../lib/sample-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function seed() {
  console.log(`Seeding ${SAMPLE_DEALS.length} deals...`);

  const rows = SAMPLE_DEALS.map((d) => ({
    id: d.id,
    date: d.date,
    company_name: d.company_name,
    investor: d.investor,
    amount_raised: d.amount_raised,
    end_market: d.end_market,
    description: d.description,
    source_url: d.source_url,
    status: d.status,
    comments: d.comments,
    created_at: d.created_at,
    updated_at: d.updated_at,
    deleted_at: d.deleted_at,
  }));

  const { error } = await supabase.from("deals").upsert(rows);

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log("Done! Seeded successfully.");
}

seed();
