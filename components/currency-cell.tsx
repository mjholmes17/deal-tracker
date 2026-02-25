"use client";

import { useState, useRef, useEffect } from "react";
import { formatCurrency, parseCurrencyInput } from "@/lib/format";

interface CurrencyCellProps {
  value: number | null;
  onSave: (value: number | null) => void;
}

export function CurrencyCell({ value, onSave }: CurrencyCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value !== null ? formatCurrency(value) : "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value !== null ? formatCurrency(value) : "");
  }, [value]);

  const handleBlur = () => {
    setEditing(false);
    const parsed = parseCurrencyInput(draft);
    if (parsed !== value) {
      onSave(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setDraft(value !== null ? formatCurrency(value) : "");
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <div
        className="cursor-pointer px-3 py-2.5 min-h-[40px] rounded transition-all hover:bg-brand-50/60 hover:ring-1 hover:ring-brand-200 tabular-nums font-medium text-emerald-700"
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        {value !== null ? formatCurrency(value) : <span className="text-text-muted italic font-normal text-xs">Undisclosed</span>}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="e.g. $45M"
      className="w-full px-3 py-2 border-2 border-brand-400 rounded-lg outline-none bg-white shadow-sm text-sm transition-shadow focus:shadow-brand-100 focus:shadow-md"
    />
  );
}
