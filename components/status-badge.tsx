"use client";

import { DEAL_STATUSES } from "@/lib/constants";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  "Saw and Passed": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  "Did Not See": { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400" },
  "Irrelevant": { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

interface StatusBadgeProps {
  value: string | null;
  onSave: (value: string | null) => void;
}

export function StatusBadge({ value, onSave }: StatusBadgeProps) {
  const style = value ? STATUS_STYLES[value] : null;

  return (
    <div className="px-2 py-1.5">
      <select
        value={value ?? ""}
        onChange={(e) => onSave(e.target.value || null)}
        className={`w-full text-xs font-medium rounded-full px-3 py-1.5 border-0 outline-none cursor-pointer appearance-none transition-colors ${
          style
            ? `${style.bg} ${style.text}`
            : "bg-brand-50 text-brand-600"
        }`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
          backgroundPosition: "right 0.4rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1em 1em",
          paddingRight: "1.6rem",
        }}
      >
        <option value="">New</option>
        {DEAL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
