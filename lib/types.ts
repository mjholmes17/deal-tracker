export type DealStatus = "Saw and Passed" | "Did Not See" | "Irrelevant" | null;

export interface Deal {
  id: string;
  date: string;
  company_name: string;
  investor: string;
  amount_raised: number | null;
  end_market: string;
  description: string;
  source_url: string;
  status: DealStatus;
  comments: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
