"use client";

interface SelectCellProps {
  value: string | null;
  options: readonly string[];
  onSave: (value: string | null) => void;
  placeholder?: string;
}

export function SelectCell({ value, options, onSave, placeholder = "Select..." }: SelectCellProps) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onSave(e.target.value || null)}
      className="w-full px-3 py-2.5 min-h-[40px] bg-transparent border-0 outline-none cursor-pointer rounded text-sm transition-all hover:bg-brand-50/60 hover:ring-1 hover:ring-brand-200 appearance-none text-text-primary"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
        backgroundPosition: "right 0.5rem center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "1.25em 1.25em",
        paddingRight: "2rem",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
