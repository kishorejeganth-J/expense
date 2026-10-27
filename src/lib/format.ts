import type { Category, Currency, DateRange, Transaction } from "@/types";
import { FALLBACK_CATEGORY_COLOR } from "@/lib/constants";

export const USD_RATE = 83.5;

export const pad = (n: number) => String(n).padStart(2, "0");

/** Convert an INR base amount into the display currency. */
export function toDisplay(amountInr: number, currency: Currency): number {
  return currency === "USD" ? amountInr / USD_RATE : amountInr;
}

/** Convert an amount entered in the display currency back into INR base. */
export function toBase(amount: number, currency: Currency): number {
  return currency === "USD" ? amount * USD_RATE : amount;
}

/** Local-safe parse of an ISO yyyy-mm-dd date (avoids UTC shifting). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function formatMoney(
  amountInr: number,
  currency: Currency,
  options: { decimals?: boolean; compact?: boolean; signed?: boolean } = {}
): string {
  const value = toDisplay(amountInr, currency);
  const abs = Math.abs(value);
  try {
    const showCents = currency === "USD" && !options.compact;
    const formatted = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      notation: options.compact ? "compact" : "standard",
      maximumFractionDigits: options.compact ? 1 : showCents || options.decimals ? 2 : 0,
      minimumFractionDigits: showCents || (options.decimals && !options.compact) ? 2 : 0,
    }).format(abs);
    return value < 0 ? `-${formatted}` : options.signed ? `+${formatted}` : formatted;
  } catch {
    return `${currency === "INR" ? "₹" : "$"}${abs.toLocaleString()}`;
  }
}

export function formatCompact(amountInr: number, currency: Currency): string {
  return formatMoney(amountInr, currency, { compact: true });
}

export function formatDate(iso: string, style: "short" | "long" | "day" = "short"): string {
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (style === "day") {
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }
  if (style === "long") {
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  }
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function relativeDay(iso: string): string {
  const diff = Math.round((parseISO(todayISO()).getTime() - parseISO(iso).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatDate(iso, "short");
}

export function monthLabel(offset = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset, 1);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export function isInCurrentMonth(iso: string): boolean {
  return monthKeyOf(iso) === currentMonthKey();
}

export function isInMonthOffset(iso: string, offset: number): boolean {
  const d = new Date();
  d.setMonth(d.getMonth() + offset, 1);
  return monthKeyOf(iso) === `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function startOfWeek(ref = new Date()): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}

export function filterByRange(txns: Transaction[], range: DateRange): Transaction[] {
  if (range === "all") return txns;
  const now = new Date();
  if (range === "month") {
    return txns.filter((t) => isInCurrentMonth(t.date));
  }
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - 6);
  const startIso = toISO(start);
  const endIso = toISO(now);
  return txns.filter((t) => t.date >= startIso && t.date <= endIso);
}

export function applyFilters(
  txns: Transaction[],
  filters: { range: DateRange; category: Category | "All"; type: "income" | "expense" | "All"; query: string }
): Transaction[] {
  const needle = filters.query.trim().toLowerCase();
  return filterByRange(txns, filters.range)
    .filter((t) => (filters.category === "All" ? true : t.category === filters.category))
    .filter((t) => (filters.type === "All" ? true : t.type === filters.type))
    .filter((t) =>
      needle
        ? `${t.title} ${t.category} ${t.method} ${t.notes ?? ""}`.toLowerCase().includes(needle)
        : true
    )
    .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date)));
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export function budgetTone(percent: number): "safe" | "warn" | "danger" {
  if (percent >= 90) return "danger";
  if (percent >= 75) return "warn";
  return "safe";
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function categoryColor(category: Category | string): string {
  return FALLBACK_CATEGORY_COLOR[category] ?? "#10b981";
}

export function sumAmount(txns: Transaction[], type?: "income" | "expense"): number {
  return txns.filter((t) => (type ? t.type === type : true)).reduce((acc, t) => acc + t.amount, 0);
}

export function uid(): string {
  return `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: string | number): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCSV(txns: Transaction[], currency: Currency): string {
  const header = ["Date", "Title", "Type", "Category", "Amount", "Currency", "Payment Method", "Notes"];
  const rows = txns.map((t) => [
    t.date,
    t.title,
    t.type,
    t.category,
    toDisplay(t.amount, currency).toFixed(2),
    currency,
    t.method,
    t.notes ?? "",
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Working late";
}
