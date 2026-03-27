-- CreateTable
CREATE TABLE "pending_deals" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "investor" VARCHAR(255) NOT NULL,
    "amount_raised" DECIMAL(15,2),
    "end_market" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "source_url" VARCHAR(500) NOT NULL,
    "batch_id" VARCHAR(36) NOT NULL,
    "scraped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_deals_pkey" PRIMARY KEY ("id")
);
