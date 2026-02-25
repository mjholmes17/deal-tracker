"use client";

import { useState, useRef, useEffect } from "react";

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  multiline?: boolean;
}

export function EditableCell({ value, onSave, className = "", multiline = false }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleBlur = () => {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <div
        className={`cursor-pointer px-3 py-2.5 min-h-[40px] rounded transition-all hover:bg-brand-50/60 hover:ring-1 hover:ring-brand-200 ${className}`}
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        {value || <span className="text-text-muted italic text-xs">Empty</span>}
      </div>
    );
  }

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-3 py-2 border-2 border-brand-400 rounded-lg outline-none bg-white shadow-sm resize-y min-h-[72px] text-sm transition-shadow focus:shadow-brand-100 focus:shadow-md ${className}`}
        rows={3}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`w-full px-3 py-2 border-2 border-brand-400 rounded-lg outline-none bg-white shadow-sm text-sm transition-shadow focus:shadow-brand-100 focus:shadow-md ${className}`}
    />
  );
}
