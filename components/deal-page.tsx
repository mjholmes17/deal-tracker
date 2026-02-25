"use client";

import { useState } from "react";
import { Deal } from "@/lib/types";
import { DealTable } from "./deal-table";
import { AddDealModal } from "./add-deal-modal";
import { LogoutButton } from "./logout-button";

interface DealPageProps {
  initialDeals: Deal[];
}

export function DealPage({ initialDeals }: DealPageProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [modalOpen, setModalOpen] = useState(false);

  const handleAdd = (deal: Deal) => {
    setDeals((prev) => [deal, ...prev]);
  };

  const newCount = deals.filter((d) => d.status === null).length;
  const reviewedCount = deals.filter((d) => d.status !== null).length;
  const missedCount = deals.filter((d) => d.status === "Did Not See").length;

  return (
    <>
      {/* Top navigation bar */}
      <header className="bg-brand-900 text-white">
        <div className="max-w-[1700px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-lg tracking-tight shadow-sm">
              W
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight leading-tight">
                Wavecrest Deal Tracker
              </h1>
              <p className="text-xs text-brand-300 leading-tight">
                Competitive deal intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-brand-300 bg-brand-800/60 rounded-full px-3 py-1.5">
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full" />
              Last scan: today 9:00 AM
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              + Add Deal
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-white border-b border-border-default">
        <div className="max-w-[1700px] mx-auto px-8 py-3 flex items-center gap-6">
          <Stat label="Total Deals" value={String(deals.length)} />
          <div className="w-px h-5 bg-border-default" />
          <Stat label="New" value={String(newCount)} accent />
          <div className="w-px h-5 bg-border-default" />
          <Stat label="Reviewed" value={String(reviewedCount)} />
          <div className="w-px h-5 bg-border-default" />
          <Stat label="Did Not See" value={String(missedCount)} warn />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-8 py-6">
        <DealTable initialDeals={deals} />
      </main>

      <AddDealModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
      />
    </>
  );
}

function Stat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted font-medium">{label}</span>
      <span
        className={`text-sm font-semibold ${
          accent ? "text-brand-600" : warn ? "text-rose-600" : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
