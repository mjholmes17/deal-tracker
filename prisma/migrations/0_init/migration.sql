-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "investor" VARCHAR(255) NOT NULL,
    "amount_raised" DECIMAL(15,2),
    "end_market" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "source_url" VARCHAR(500) NOT NULL,
    "status" VARCHAR(50),
    "comments" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_sources" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "source_type" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_scraped_at" TIMESTAMP(3),

    CONSTRAINT "scrape_sources_pkey" PRIMARY KEY ("id")
);
