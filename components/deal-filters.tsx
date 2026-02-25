"use client";

import { END_MARKETS, DEAL_STATUSES } from "@/lib/constants";

export interface FilterState {
  search: string;
  status: string[];
  endMarket: string;
  investor: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  status: [],
  endMarket: "",
  investor: "",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};

export function isFiltered(filters: FilterState): boolean {
  return (
    filters.search !== "" ||
    filters.status.length > 0 ||
    filters.endMarket !== "" ||
    filters.investor !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.amountMin !== "" ||
    filters.amountMax !== ""
  );
}

interface DealFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  investors: string[];
}

export function DealFilters({ filters, onChange, investors }: DealFiltersProps) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const toggleStatus = (s: string) => {
    const next = filters.status.includes(s)
      ? filters.status.filter((v) => v !== s)
      : [...filters.status, s];
    set("status", next);
  };

  const hasFilters = isFiltered(filters);

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        >
          <path
            d="M7 12A5 5 0 107 2a5 5 0 000 10zM13 13l-3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search deals by company, investor, description, or comments..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-border-default rounded-lg bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide mr-1">Status:</span>
          <StatusChip
            label="New"
            active={filters.status.includes("new")}
            onClick={() => toggleStatus("new")}
          />
          {DEAL_STATUSES.map((s) => (
            <StatusChip
              key={s}
              label={s}
              active={filters.status.includes(s)}
              onClick={() => toggleStatus(s)}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-border-default mx-1" />

        {/* End Market dropdown */}
        <select
          value={filters.endMarket}
          onChange={(e) => set("endMarket", e.target.value)}
          className="text-xs border border-border-default rounded-lg px-2.5 py-1.5 bg-white text-text-secondary focus:outline-none focus:border-brand-500"
        >
          <option value="">All Markets</option>
          {END_MARKETS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Investor dropdown */}
        <select
          value={filters.investor}
          onChange={(e) => set("investor", e.target.value)}
          className="text-xs border border-border-default rounded-lg px-2.5 py-1.5 bg-white text-text-secondary focus:outline-none focus:border-brand-500"
        >
          <option value="">All Investors</option>
          {investors.map((inv) => (
            <option key={inv} value={inv}>{inv}</option>
          ))}
        </select>

        <div className="w-px h-5 bg-border-default mx-1" />

        {/* Date range */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-text-muted font-medium">From</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
            className="border border-border-default rounded-lg px-2 py-1.5 bg-white text-text-secondary focus:outline-none focus:border-brand-500"
          />
          <span className="text-text-muted font-medium">to</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
            className="border border-border-default rounded-lg px-2 py-1.5 bg-white text-text-secondary focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="w-px h-5 bg-border-default mx-1" />

        {/* Amount range */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-text-muted font-medium">$</span>
          <input
            type="text"
            value={filters.amountMin}
            onChange={(e) => set("amountMin", e.target.value)}
            placeholder="Min"
            className="w-20 border border-border-default rounded-lg px-2 py-1.5 bg-white text-text-secondary focus:outline-none focus:border-brand-500"
          />
          <span className="text-text-muted">–</span>
          <input
            type="text"
            value={filters.amountMax}
            onChange={(e) => set("amountMax", e.target.value)}
            placeholder="Max"
            className="w-20 border border-border-default rounded-lg px-2 py-1.5 bg-white text-text-secondary focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Clear all */}
        {hasFilters && (
          <>
            <div className="w-px h-5 bg-border-default mx-1" />
            <button
              onClick={() => onChange(EMPTY_FILTERS)}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors"
            >
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StatusChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
        active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-text-secondary border-border-default hover:border-brand-300 hover:text-brand-600"
      }`}
    >
      {label}
    </button>
  );
}
