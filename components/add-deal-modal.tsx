"use client";

import { useState } from "react";
import { END_MARKETS } from "@/lib/constants";
import { Deal } from "@/lib/types";

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (deal: Deal) => void;
}

export function AddDealModal({ open, onClose, onAdd }: AddDealModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    company_name: "",
    investor: "",
    amount_raised: "",
    end_market: "",
    description: "",
    source_url: "",
  });

  if (!open) return null;

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.investor.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        date: form.date,
        company_name: form.company_name.trim(),
        investor: form.investor.trim(),
        amount_raised: form.amount_raised ? parseFloat(form.amount_raised.replace(/[,$]/g, "")) || null : null,
        end_market: form.end_market,
        description: form.description.trim(),
        source_url: form.source_url.trim(),
      };

      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create deal");

      const newDeal = await res.json();
      onAdd({
        ...newDeal,
        amount_raised: newDeal.amount_raised ? Number(newDeal.amount_raised) : null,
      });

      // Reset form and close
      setForm({
        date: new Date().toISOString().split("T")[0],
        company_name: "",
        investor: "",
        amount_raised: "",
        end_market: "",
        description: "",
        source_url: "",
      });
      onClose();
    } catch (err) {
      console.error("Failed to add deal:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-border-default">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-base font-semibold text-text-primary">Add New Deal</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" required>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="field-input"
                required
              />
            </Field>
            <Field label="$ Raised">
              <input
                type="text"
                value={form.amount_raised}
                onChange={(e) => set("amount_raised", e.target.value)}
                placeholder="e.g. 50000000"
                className="field-input"
              />
            </Field>
          </div>

          <Field label="Company Name" required>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              placeholder="Enter company name"
              className="field-input"
              required
              autoFocus
            />
          </Field>

          <Field label="Investor" required>
            <input
              type="text"
              value={form.investor}
              onChange={(e) => set("investor", e.target.value)}
              placeholder="Enter investor name"
              className="field-input"
              required
            />
          </Field>

          <Field label="End Market">
            <select
              value={form.end_market}
              onChange={(e) => set("end_market", e.target.value)}
              className="field-input"
            >
              <option value="">Select market...</option>
              {END_MARKETS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief company description"
              className="field-input min-h-[72px] resize-y"
              rows={2}
            />
          </Field>

          <Field label="Source URL">
            <input
              type="url"
              value={form.source_url}
              onChange={(e) => set("source_url", e.target.value)}
              placeholder="https://..."
              className="field-input"
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.company_name.trim() || !form.investor.trim()}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              {submitting ? "Adding..." : "Add Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-text-secondary mb-1 block">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
