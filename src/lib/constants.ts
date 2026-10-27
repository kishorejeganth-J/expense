import {
  Banknote,
  BriefcaseBusiness,
  CarFront,
  Clapperboard,
  CreditCard,
  Laptop,
  Landmark,
  ReceiptText,
  ShoppingBag,
  Smartphone,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Budgets, Category, PaymentMethod, Settings, Transaction } from "@/types";

export const APP_NAME = "Finora";
export const STORAGE_KEY = "finora.expense-tracker.v1";
export const BACKUP_VERSION = 1;

export const INCOME_CATEGORIES: Category[] = ["Salary", "Freelance"];
export const EXPENSE_CATEGORIES: Category[] = ["Food", "Transport", "Subscriptions", "Shopping", "Bills"];
export const CATEGORIES: Category[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
export const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Credit Card", "Cash", "Bank Transfer"];

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  hex: string;
  soft: string;
  dot: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Food: {
    label: "Food & Dining",
    icon: UtensilsCrossed,
    hex: "#10b981",
    soft: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
    dot: "bg-emerald-500",
  },
  Transport: {
    label: "Transport",
    icon: CarFront,
    hex: "#38bdf8",
    soft: "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20",
    dot: "bg-sky-500",
  },
  Subscriptions: {
    label: "Subscriptions",
    icon: Clapperboard,
    hex: "#a78bfa",
    soft: "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20",
    dot: "bg-violet-500",
  },
  Shopping: {
    label: "Shopping",
    icon: ShoppingBag,
    hex: "#fb7185",
    soft: "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20",
    dot: "bg-rose-500",
  },
  Bills: {
    label: "Bills & Utilities",
    icon: ReceiptText,
    hex: "#fbbf24",
    soft: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
    dot: "bg-amber-500",
  },
  Salary: {
    label: "Salary",
    icon: BriefcaseBusiness,
    hex: "#34d399",
    soft: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
    dot: "bg-emerald-500",
  },
  Freelance: {
    label: "Freelance",
    icon: Laptop,
    hex: "#818cf8",
    soft: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20",
    dot: "bg-indigo-500",
  },
};

export const FALLBACK_CATEGORY_COLOR: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category, CATEGORY_META[category].hex])
);

export const PAYMENT_META: Record<PaymentMethod, { icon: LucideIcon; label: string }> = {
  UPI: { icon: Smartphone, label: "UPI" },
  "Credit Card": { icon: CreditCard, label: "Credit Card" },
  Cash: { icon: Banknote, label: "Cash" },
  "Bank Transfer": { icon: Landmark, label: "Bank Transfer" },
};

export const DEFAULT_BUDGETS: Budgets = {
  overall: 20000,
  categories: {
    Food: 5000,
    Transport: 1500,
    Subscriptions: 700,
    Shopping: 4500,
    Bills: 2500,
    Salary: 0,
    Freelance: 0,
  },
};

export const DEFAULT_SETTINGS: Settings = {
  currency: "INR",
  theme: "dark",
  name: "Aarav Mehta",
  email: "aarav@finora.app",
};

const pad = (n: number) => String(n).padStart(2, "0");

function dateThisMonth(day: number): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const safe = Math.max(1, Math.min(day, lastDay, now.getDate()));
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(safe)}`;
}

function datePrevMonth(day: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(Math.min(day, lastDay))}`;
}

/**
 * Eight realistic current-month transactions plus a small previous-month
 * history so month-over-month comparisons are meaningful on first load.
 */
function createSeedTransactions(): Transaction[] {
  const now = Date.now();
  const rows: Array<Omit<Transaction, "id" | "createdAt">> = [
    {
      title: "Monthly salary",
      amount: 89500,
      type: "income",
      category: "Salary",
      date: dateThisMonth(1),
      method: "Bank Transfer",
      notes: "Payroll · Nexora Labs",
    },
    {
      title: "Freelance — brand identity",
      amount: 18000,
      type: "income",
      category: "Freelance",
      date: dateThisMonth(6),
      method: "Bank Transfer",
      notes: "Invoice #FN-204 · Northwind Studio",
    },
    {
      title: "Dinner at Toit",
      amount: 1850,
      type: "expense",
      category: "Food",
      date: dateThisMonth(12),
      method: "Credit Card",
      notes: "Weekend dinner with friends",
    },
    {
      title: "Metro & cab rides",
      amount: 640,
      type: "expense",
      category: "Transport",
      date: dateThisMonth(13),
      method: "UPI",
    },
    {
      title: "Netflix subscription",
      amount: 649,
      type: "expense",
      category: "Subscriptions",
      date: dateThisMonth(8),
      method: "Credit Card",
      notes: "Premium · auto-renewed",
    },
    {
      title: "Noise-cancelling headphones",
      amount: 4299,
      type: "expense",
      category: "Shopping",
      date: dateThisMonth(10),
      method: "Credit Card",
      notes: "Sony WH-1000XM4",
    },
    {
      title: "Electricity bill",
      amount: 1860,
      type: "expense",
      category: "Bills",
      date: dateThisMonth(5),
      method: "UPI",
      notes: "BESCOM · monthly cycle",
    },
    {
      title: "Weekly groceries",
      amount: 2340,
      type: "expense",
      category: "Food",
      date: dateThisMonth(3),
      method: "Cash",
      notes: "BigBasket + local market",
    },
    {
      title: "Monthly salary",
      amount: 89500,
      type: "income",
      category: "Salary",
      date: datePrevMonth(1),
      method: "Bank Transfer",
      notes: "Previous month payroll",
    },
    {
      title: "Freelance — landing page",
      amount: 15000,
      type: "income",
      category: "Freelance",
      date: datePrevMonth(14),
      method: "Bank Transfer",
    },
    {
      title: "Weekend brunch",
      amount: 1450,
      type: "expense",
      category: "Food",
      date: datePrevMonth(18),
      method: "Credit Card",
    },
    {
      title: "Running sneakers",
      amount: 3200,
      type: "expense",
      category: "Shopping",
      date: datePrevMonth(20),
      method: "Credit Card",
    },
    {
      title: "Home internet",
      amount: 1199,
      type: "expense",
      category: "Bills",
      date: datePrevMonth(7),
      method: "UPI",
    },
    {
      title: "Gym membership",
      amount: 1499,
      type: "expense",
      category: "Subscriptions",
      date: datePrevMonth(4),
      method: "Credit Card",
    },
    {
      title: "Groceries & supplies",
      amount: 2400,
      type: "expense",
      category: "Food",
      date: datePrevMonth(11),
      method: "UPI",
    },
    {
      title: "Airport cab",
      amount: 780,
      type: "expense",
      category: "Transport",
      date: datePrevMonth(24),
      method: "Cash",
    },
  ];

  return rows.map((row, index) => ({
    ...row,
    id: `seed-${pad(index + 1)}`,
    createdAt: now - index * 1000,
    notes: row.notes,
  }));
}

export const SEED_TRANSACTIONS: Transaction[] = createSeedTransactions();

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
