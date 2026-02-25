export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(0)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function parseCurrencyInput(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, "").toLowerCase();
  if (!cleaned || cleaned === "—") return null;

  let multiplier = 1;
  let numStr = cleaned;

  if (cleaned.endsWith("b")) {
    multiplier = 1_000_000_000;
    numStr = cleaned.slice(0, -1);
  } else if (cleaned.endsWith("m")) {
    multiplier = 1_000_000;
    numStr = cleaned.slice(0, -1);
  } else if (cleaned.endsWith("k")) {
    multiplier = 1_000;
    numStr = cleaned.slice(0, -1);
  }

  const num = parseFloat(numStr);
  if (isNaN(num)) return null;
  return num * multiplier;
}
