"use client";

import { useState, useCallback } from "react";
import { Deal } from "@/lib/types";
import { DealTable } from "./deal-table";
import { AddDealModal } from "./add-deal-modal";
import { LogoutButton } from "./logout-button";

interface DealPageProps {
  initialDeals: Deal[];
  lastScanAt: string | null;
}

export function DealPage({ initialDeals, lastScanAt }: DealPageProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(lastScanAt);

  const handleAdd = (deal: Deal) => {
    setDeals((prev) => [deal, ...prev]);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res = await fetch("/api/deals/refresh", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        // Re-fetch all deals to pick up any new ones
        const dealsRes = await fetch("/api/deals");
        if (dealsRes.ok) {
          const freshDeals = await dealsRes.json();
          setDeals(
            freshDeals.map((d: Record<string, unknown>) => ({
              ...d,
              amount_raised: d.amount_raised ? Number(d.amount_raised) : null,
            }))
          );
        }
        setLastScan(new Date().toISOString());
        setRefreshResult(
          data.newDeals > 0
            ? `Found ${data.newDeals} new deal(s)!`
            : "No new deals found."
        );
      } else {
        setRefreshResult("Refresh failed. Check server logs.");
      }
    } catch {
      setRefreshResult("Refresh failed. Is the scraper configured?");
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshResult(null), 5000);
    }
  }, []);

  const newCount = deals.filter((d) => d.status === null).length;
  const reviewedCount = deals.filter((d) => d.status !== null).length;
  const missedCount = deals.filter((d) => d.status === "Did Not See").length;

  return (
    <>
      {/* Top navigation bar */}
      <header className="bg-brand-900 text-white">
        <div className="max-w-[1700px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight leading-tight">
                Growth Equity Deal Tracker
              </h1>
              <p className="text-xs text-brand-300 leading-tight">
                Competitive deal intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastScan && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-brand-300 bg-brand-800/60 rounded-full px-3 py-1.5">
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full" />
                Last scan: {formatScanTime(lastScan)}
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-2 bg-brand-800/60 hover:bg-brand-700/80 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              title="Run scraper to find new deals"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className={refreshing ? "animate-spin" : ""}
              >
                <path
                  d="M14 8A6 6 0 112.34 5M14 2v3.5h-3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {refreshing ? "Scanning..." : "Refresh Deals"}
            </button>
            {refreshing && (
              <span className="text-xs text-brand-300">
                Crawling the web — this may take a few minutes
              </span>
            )}
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

      {/* Refresh result toast */}
      {refreshResult && (
        <div className="toast-enter fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm z-50 border border-brand-700">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-brand-300 shrink-0">
            <path
              d="M14 8A6 6 0 112.34 5M14 2v3.5h-3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{refreshResult}</span>
        </div>
      )}
    </>
  );
}

function formatScanTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    const isToday = date.toDateString() === now.toDateString();
    return isToday ? `today ${time}` : `yesterday ${time}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + ` ${time}`;
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
