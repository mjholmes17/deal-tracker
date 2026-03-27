"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { PendingDeal } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/format";
import { LogoutButton } from "./logout-button";

interface ReviewPageProps {
  initialDeals: PendingDeal[];
}

export function ReviewPage({ initialDeals }: ReviewPageProps) {
  const [deals, setDeals] = useState<PendingDeal[]>(initialDeals);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === deals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(deals.map((d) => d.id)));
    }
  };

  const handleApproveAll = useCallback(async () => {
    if (deals.length === 0) return;
    setApproving(true);
    try {
      const res = await fetch("/api/pending-deals/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeals([]);
        setSelected(new Set());
        showToast(`Approved ${data.approved} deal(s) — firm has been notified`);
      } else {
        showToast(`Error: ${data.error}`);
      }
    } catch {
      showToast("Failed to approve deals");
    } finally {
      setApproving(false);
    }
  }, [deals.length]);

  const handleApproveSelected = useCallback(async () => {
    if (selected.size === 0) return;
    setApproving(true);
    const ids = Array.from(selected);
    try {
      const res = await fetch("/api/pending-deals/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeals((prev) => prev.filter((d) => !selected.has(d.id)));
        setSelected(new Set());
        showToast(`Approved ${data.approved} deal(s) — firm has been notified`);
      } else {
        showToast(`Error: ${data.error}`);
      }
    } catch {
      showToast("Failed to approve deals");
    } finally {
      setApproving(false);
    }
  }, [selected]);

  const handleRejectSelected = useCallback(async () => {
    if (selected.size === 0) return;
    setRejecting(true);
    const ids = Array.from(selected);
    setDeals((prev) => prev.filter((d) => !selected.has(d.id)));
    setSelected(new Set());
    try {
      const res = await fetch("/api/pending-deals/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Rejected ${data.rejected} deal(s)`);
      }
    } catch {
      showToast("Failed to reject deals");
    } finally {
      setRejecting(false);
    }
  }, [selected]);

  const handleReject = useCallback(async (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      const res = await fetch("/api/pending-deals/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (res.ok) {
        showToast("Deal rejected");
      }
    } catch {
      showToast("Failed to reject deal");
    }
  }, []);

  return (
    <>
      {/* Header */}
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
                Deal Review
              </h1>
              <p className="text-xs text-brand-300 leading-tight">
                Approve or reject scraped deals before they go to the team
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-3 py-2 bg-brand-800/60 hover:bg-brand-700/80 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Back to Tracker
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Action bar */}
      <div className="bg-white border-b border-border-default">
        <div className="max-w-[1700px] mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">Pending</span>
              <span className="text-sm font-semibold text-brand-600">{deals.length}</span>
            </div>
            {selected.size > 0 && (
              <>
                <div className="w-px h-5 bg-border-default" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Selected</span>
                  <span className="text-sm font-semibold text-text-primary">{selected.size}</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <>
                <button
                  onClick={handleRejectSelected}
                  disabled={rejecting}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-medium rounded-lg transition-colors border border-rose-200 disabled:opacity-50"
                >
                  Reject Selected ({selected.size})
                </button>
                <button
                  onClick={handleApproveSelected}
                  disabled={approving}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg transition-colors border border-emerald-200 disabled:opacity-50"
                >
                  Approve Selected ({selected.size})
                </button>
              </>
            )}
            {deals.length > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={approving}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                {approving ? "Approving..." : `Approve All (${deals.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-8 py-6">
        {deals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-text-muted">No deals pending review</p>
            <Link
              href="/"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-2 inline-block"
            >
              Back to deal tracker
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border-default shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default bg-slate-50/80">
                    <th className="px-3 py-3 w-[40px]">
                      <input
                        type="checkbox"
                        checked={selected.size === deals.length && deals.length > 0}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider">Date</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider">Company</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider">Investor</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider">$ Raised</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider">End Market</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider min-w-[280px]">Description</th>
                    <th className="px-3 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider">Source</th>
                    <th className="px-3 py-3 w-[80px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal, i) => (
                    <tr
                      key={deal.id}
                      className={`group border-b border-border-subtle transition-colors hover:bg-brand-50/30 ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(deal.id)}
                          onChange={() => toggleSelect(deal.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2 text-text-secondary whitespace-nowrap">
                        {formatDate(deal.date)}
                      </td>
                      <td className="px-3 py-2 font-semibold text-text-primary">
                        {deal.company_name}
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        {deal.investor}
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        {formatCurrency(deal.amount_raised)}
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        {deal.end_market}
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-xs leading-relaxed">
                        {deal.description}
                      </td>
                      <td className="px-2">
                        {deal.source_url && /^https?:\/\//i.test(deal.source_url) ? (
                          <a
                            href={deal.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-500 hover:text-brand-700 font-medium"
                          >
                            Link
                          </a>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-2">
                        <button
                          onClick={() => handleReject(deal.id)}
                          className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded transition-all font-medium"
                          title="Reject deal"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast-enter fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm z-50 border border-brand-700">
          {toast}
        </div>
      )}
    </>
  );
}
