-- CreateTable
CREATE TABLE "scan_logs" (
    "id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deals_found" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "scan_logs_pkey" PRIMARY KEY ("id")
);
