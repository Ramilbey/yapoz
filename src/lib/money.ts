export function formatMoney(minor: number, currency = "MYR"): string {
  const major = minor / 100;
  if (currency === "MYR") return `RM ${Number.isInteger(major) ? major : major.toFixed(2)}`;
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(major);
}
