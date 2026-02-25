"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Deal, DealStatus } from "@/lib/types";
import { END_MARKETS } from "@/lib/constants";
import { formatDate, parseCurrencyInput } from "@/lib/format";
import { EditableCell } from "./editable-cell";
import { SelectCell } from "./select-cell";
import { CurrencyCell } from "./currency-cell";
import { StatusBadge } from "./status-badge";
import { DealFilters, FilterState, EMPTY_FILTERS, isFiltered } from "./deal-filters";

const UNDO_TIMEOUT_MS = 5000;

type SortField = keyof Deal;
type SortDir = "asc" | "desc";

interface DealTableProps {
  initialDeals: Deal[];
}

function applyFilters(deals: Deal[], filters: FilterState): Deal[] {
  return deals.filter((deal) => {
    // Full-text search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [deal.company_name, deal.investor, deal.description, deal.comments]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // Status filter
    if (filters.status.length > 0) {
      const dealStatus = deal.status === null ? "new" : deal.status;
      if (!filters.status.includes(dealStatus)) return false;
    }

    // End market
    if (filters.endMarket && deal.end_market !== filters.endMarket) return false;

    // Investor
    if (filters.investor && deal.investor !== filters.investor) return false;

    // Date range
    if (filters.dateFrom && deal.date < filters.dateFrom) return false;
    if (filters.dateTo && deal.date > filters.dateTo) return false;

    // Amount range
    if (filters.amountMin) {
      const min = parseCurrencyInput(filters.amountMin);
      if (min !== null && (deal.amount_raised === null || deal.amount_raised < min)) return false;
    }
    if (filters.amountMax) {
      const max = parseCurrencyInput(filters.amountMax);
      if (max !== null && (deal.amount_raised === null || deal.amount_raised > max)) return false;
    }

    return true;
  });
}

function exportCsv(deals: Deal[]) {
  const headers = ["Date", "Company Name", "Investor", "$ Raised", "End Market", "Description", "Comments", "Status", "Source URL"];
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = deals.map((d) => [
    d.date,
    d.company_name,
    d.investor,
    d.amount_raised !== null ? String(d.amount_raised) : "",
    d.end_market,
    d.description,
    d.comments,
    d.status ?? "",
    d.source_url,
  ].map(escape).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wavecrest-deals-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DealTable({ initialDeals }: DealTableProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deletedDeal, setDeletedDeal] = useState<Deal | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  // Sync when initialDeals changes (e.g. after refetch or new deal added)
  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  // Unique investors for the filter dropdown
  const investors = useMemo(
    () => [...new Set(deals.map((d) => d.investor))].sort(),
    [deals]
  );

  const updateDeal = async (id: string, field: keyof Deal, value: string | number | null) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, [field]: value, updated_at: new Date().toISOString() } : d
      )
    );

    setSaving(true);
    try {
      await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteDeal = useCallback(async (deal: Deal) => {
    if (undoTimer) clearTimeout(undoTimer);
    setDeals((prev) => prev.filter((d) => d.id !== deal.id));
    setDeletedDeal(deal);
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to delete:", err);
      }
      setDeletedDeal(null);
    }, UNDO_TIMEOUT_MS);
    setUndoTimer(timer);
  }, [undoTimer]);

  const undoDelete = useCallback(() => {
    if (!deletedDeal) return;
    if (undoTimer) clearTimeout(undoTimer);
    setDeals((prev) => [...prev, deletedDeal]);
    setDeletedDeal(null);
    setUndoTimer(null);
  }, [deletedDeal, undoTimer]);

  useEffect(() => {
    return () => {
      if (undoTimer) clearTimeout(undoTimer);
    };
  }, [undoTimer]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Filter then sort
  const filteredDeals = useMemo(() => applyFilters(deals, filters), [deals, filters]);

  const sortedDeals = useMemo(() => {
    return [...filteredDeals].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredDeals, sortField, sortDir]);

  const SortHeader = ({ field, label, className = "" }: { field: SortField; label: string; className?: string }) => (
    <th
      className={`px-3 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors hover:text-brand-600 hover:bg-brand-50/40 ${className}`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <span className={`transition-opacity ${sortField === field ? "opacity-100" : "opacity-0"}`}>
          {sortDir === "asc" ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-brand-500">
              <path d="M6 3L9.5 7.5H2.5L6 3Z" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-brand-500">
              <path d="M6 9L2.5 4.5H9.5L6 9Z" fill="currentColor"/>
            </svg>
          )}
        </span>
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <DealFilters filters={filters} onChange={setFilters} investors={investors} />

      {/* Toolbar row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {isFiltered(filters)
            ? `Showing ${sortedDeals.length} of ${deals.length} deals`
            : `${deals.length} deals`}
        </span>
        <button
          onClick={() => exportCsv(sortedDeals)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-brand-600 transition-colors px-3 py-1.5 border border-border-default rounded-lg hover:border-brand-300"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 11v2.5A1.5 1.5 0 003.5 15h9a1.5 1.5 0 001.5-1.5V11M8 1v9M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border-default shadow-sm overflow-hidden">
        {/* Saving indicator */}
        {saving && (
          <div className="h-0.5 bg-brand-100 overflow-hidden">
            <div className="h-full w-1/3 bg-brand-500 animate-pulse rounded" />
          </div>
        )}

        <div className="deal-table-wrap overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default bg-slate-50/80">
                <SortHeader field="date" label="Date" className="w-[120px]" />
                <SortHeader field="company_name" label="Company" className="w-[160px]" />
                <SortHeader field="investor" label="Investor" className="w-[180px]" />
                <SortHeader field="amount_raised" label="$ Raised" className="w-[120px]" />
                <SortHeader field="end_market" label="End Market" className="w-[170px]" />
                <SortHeader field="description" label="Description" className="min-w-[280px]" />
                <SortHeader field="comments" label="Comments" className="min-w-[200px]" />
                <SortHeader field="status" label="Status" className="w-[160px]" />
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider w-[70px]">
                  Source
                </th>
                <th className="w-[44px]" />
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map((deal, i) => (
                <tr
                  key={deal.id}
                  className={`group border-b border-border-subtle transition-colors hover:bg-brand-50/30 ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  <td>
                    <EditableCell
                      value={formatDate(deal.date)}
                      onSave={(v) => {
                        const parsed = new Date(v);
                        if (!isNaN(parsed.getTime())) {
                          updateDeal(deal.id, "date", parsed.toISOString().split("T")[0]);
                        }
                      }}
                      className="text-text-secondary"
                    />
                  </td>
                  <td>
                    <EditableCell
                      value={deal.company_name}
                      onSave={(v) => updateDeal(deal.id, "company_name", v)}
                      className="font-semibold text-text-primary"
                    />
                  </td>
                  <td>
                    <EditableCell
                      value={deal.investor}
                      onSave={(v) => updateDeal(deal.id, "investor", v)}
                      className="text-text-secondary"
                    />
                  </td>
                  <td>
                    <CurrencyCell
                      value={deal.amount_raised}
                      onSave={(v) => updateDeal(deal.id, "amount_raised", v)}
                    />
                  </td>
                  <td>
                    <SelectCell
                      value={deal.end_market}
                      options={END_MARKETS}
                      onSave={(v) => updateDeal(deal.id, "end_market", v ?? "")}
                      placeholder="Select market..."
                    />
                  </td>
                  <td>
                    <EditableCell
                      value={deal.description}
                      onSave={(v) => updateDeal(deal.id, "description", v)}
                      multiline
                      className="text-text-secondary text-xs leading-relaxed"
                    />
                  </td>
                  <td>
                    <EditableCell
                      value={deal.comments}
                      onSave={(v) => updateDeal(deal.id, "comments", v)}
                      multiline
                      className="text-text-secondary text-xs leading-relaxed"
                    />
                  </td>
                  <td>
                    <StatusBadge
                      value={deal.status}
                      onSave={(v) => updateDeal(deal.id, "status", v as DealStatus)}
                    />
                  </td>
                  <td className="px-2">
                    {deal.source_url ? (
                      <a
                        href={deal.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors"
                        title={deal.source_url}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                          <path d="M6.5 3.5H3.5C2.94772 3.5 2.5 3.94772 2.5 4.5V12.5C2.5 13.0523 2.94772 13.5 3.5 13.5H11.5C12.0523 13.5 12.5 13.0523 12.5 12.5V9.5M9.5 2.5H13.5M13.5 2.5V6.5M13.5 2.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Link
                      </a>
                    ) : (
                      <span className="text-text-muted text-xs px-1">--</span>
                    )}
                  </td>
                  <td className="px-1">
                    <button
                      onClick={() => deleteDeal(deal)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete deal"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M6.667 7.333V11.333M9.333 7.333V11.333M3.333 4L4 12.667C4 13.403 4.597 14 5.333 14H10.667C11.403 14 12 13.403 12 12.667L12.667 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {sortedDeals.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand-400">
                          <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <p className="text-sm text-text-muted">
                        {isFiltered(filters) ? "No deals match your filters" : "No deals found"}
                      </p>
                      {isFiltered(filters) ? (
                        <button
                          onClick={() => setFilters(EMPTY_FILTERS)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          Clear all filters
                        </button>
                      ) : (
                        <p className="text-xs text-text-muted">Deals will appear here once the daily scraper runs.</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Undo toast */}
        {deletedDeal && (
          <div className="toast-enter fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-900 text-white pl-5 pr-3 py-3 rounded-xl shadow-2xl flex items-center gap-4 text-sm z-50 border border-brand-700">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-brand-300 shrink-0">
              <path d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M6.667 7.333V11.333M9.333 7.333V11.333M3.333 4L4 12.667C4 13.403 4.597 14 5.333 14H10.667C11.403 14 12 13.403 12 12.667L12.667 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>
              Deleted <strong className="font-semibold">{deletedDeal.company_name}</strong>
            </span>
            <button
              onClick={undoDelete}
              className="ml-2 px-3 py-1.5 bg-white text-brand-900 rounded-lg text-xs font-semibold hover:bg-brand-100 transition-colors"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
