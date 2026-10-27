import type { Budgets, Category, DateRange, PaymentMethod, Transaction } from "@/types";
import { CATEGORIES, CATEGORY_META, PAYMENT_METHODS, WEEKDAYS } from "@/lib/constants";
import {
  budgetTone,
  filterByRange,
  formatDate,
  isInCurrentMonth,
  isInMonthOffset,
  monthKeyOf,
  parseISO,
  sumAmount,
  toDisplay,
  toISO,
} from "@/lib/format";

export interface KpiSummary {
  balance: number;
  income: number;
  expenses: number;
  remaining: number;
  overallBudget: number;
  budgetUsedPct: number;
  savingsRate: number;
  balanceDelta: number | null;
  incomeDelta: number | null;
  expenseDelta: number | null;
  remainingDelta: number | null;
  txnCount: number;
}

function change(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export function getKpis(transactions: Transaction[], budgets: Budgets): KpiSummary {
  const current = transactions.filter((t) => isInCurrentMonth(t.date));
  const previous = transactions.filter((t) => isInMonthOffset(t.date, -1));

  const income = sumAmount(current, "income");
  const expenses = sumAmount(current, "expense");
  const prevIncome = sumAmount(previous, "income");
  const prevExpenses = sumAmount(previous, "expense");

  const balance = sumAmount(transactions, "income") - sumAmount(transactions, "expense");
  const now = new Date();
  const startOfCurrentMonth = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
  const allBefore = transactions.filter((t) => t.date < startOfCurrentMonth);
  const balanceBefore = sumAmount(allBefore, "income") - sumAmount(allBefore, "expense");

  const remaining = budgets.overall - expenses;
  const prevRemaining = budgets.overall - prevExpenses;

  return {
    balance,
    income,
    expenses,
    remaining,
    overallBudget: budgets.overall,
    budgetUsedPct: budgets.overall > 0 ? Math.round((expenses / budgets.overall) * 100) : 0,
    savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
    balanceDelta: change(balance, balanceBefore),
    incomeDelta: change(income, prevIncome),
    expenseDelta: change(expenses, prevExpenses),
    remainingDelta: change(remaining, prevRemaining),
    txnCount: current.length,
  };
}

export interface CategorySpend {
  category: Category;
  value: number;
  pct: number;
  count: number;
  color: string;
}

export function spendingByCategory(transactions: Transaction[], currency: "INR" | "USD"): CategorySpend[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totals = new Map<Category, { value: number; count: number }>();
  expenses.forEach((tx) => {
    const current = totals.get(tx.category) ?? { value: 0, count: 0 };
    totals.set(tx.category, { value: current.value + tx.amount, count: current.count + 1 });
  });
  const grandTotal = expenses.reduce((acc, tx) => acc + tx.amount, 0);
  return Array.from(totals.entries())
    .map(([category, { value, count }]) => ({
      category,
      value: Number(toDisplay(value, currency).toFixed(2)),
      pct: grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0,
      count,
      color: CATEGORY_META[category].hex,
    }))
    .sort((a, b) => b.value - a.value);
}

export interface CashflowPoint {
  key: string;
  label: string;
  fullLabel: string;
  income: number;
  expenses: number;
  net: number;
}

export function buildCashflow(
  transactions: Transaction[],
  range: DateRange,
  currency: "INR" | "USD"
): CashflowPoint[] {
  const now = new Date();
  const buckets: Array<{ key: string; label: string; fullLabel: string }> = [];

  if (range === "week") {
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({
        key: toISO(d),
        label: d.toLocaleDateString("en-GB", { weekday: "short" }),
        fullLabel: formatDate(toISO(d), "long"),
      });
    }
  } else if (range === "month") {
    // Weekly buckets keep the trend readable while still giving 4–5 data points.
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let start = 1, week = 1; start <= lastDay; start += 7, week += 1) {
      const end = Math.min(start + 6, lastDay);
      const from = new Date(now.getFullYear(), now.getMonth(), start);
      const to = new Date(now.getFullYear(), now.getMonth(), end);
      buckets.push({
        key: `w${week}`,
        label: `W${week}`,
        fullLabel: `${formatDate(toISO(from), "short")} – ${formatDate(toISO(to), "short")}`,
      });
    }
  } else {
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.push({
        key,
        label: d.toLocaleDateString("en-GB", { month: "short" }),
        fullLabel: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      });
    }
  }

  const aggregate = new Map<string, { income: number; expenses: number }>();
  transactions.forEach((tx) => {
    let key: string;
    if (range === "all") {
      key = monthKeyOf(tx.date);
    } else if (range === "month") {
      key = `w${Math.floor((parseISO(tx.date).getDate() - 1) / 7) + 1}`;
    } else {
      key = tx.date;
    }
    const current = aggregate.get(key) ?? { income: 0, expenses: 0 };
    if (tx.type === "income") current.income += tx.amount;
    else current.expenses += tx.amount;
    aggregate.set(key, current);
  });

  return buckets.map((bucket) => {
    const values = aggregate.get(bucket.key) ?? { income: 0, expenses: 0 };
    const income = Number(toDisplay(values.income, currency).toFixed(2));
    const expenses = Number(toDisplay(values.expenses, currency).toFixed(2));
    return {
      ...bucket,
      income,
      expenses,
      net: Number((income - expenses).toFixed(2)),
    };
  });
}

export function weekdaySpend(transactions: Transaction[], currency: "INR" | "USD") {
  const totals = WEEKDAYS.map((day) => ({ day, value: 0 }));
  transactions
    .filter((t) => t.type === "expense")
    .forEach((tx) => {
      const index = (parseISO(tx.date).getDay() + 6) % 7;
      if (totals[index]) totals[index].value += tx.amount;
    });
  return totals.map((item) => ({ ...item, value: Number(toDisplay(item.value, currency).toFixed(2)) }));
}

export function paymentBreakdown(transactions: Transaction[], currency: "INR" | "USD") {
  const expenses = transactions.filter((t) => t.type === "expense");
  const total = expenses.reduce((acc, tx) => acc + tx.amount, 0);
  return PAYMENT_METHODS.map((method: PaymentMethod) => {
    const value = expenses.filter((t) => t.method === method).reduce((acc, tx) => acc + tx.amount, 0);
    return {
      method,
      value: Number(toDisplay(value, currency).toFixed(2)),
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
      count: expenses.filter((t) => t.method === method).length,
    };
  }).sort((a, b) => b.value - a.value);
}

export interface BudgetUsage {
  category: Category;
  spent: number;
  limit: number;
  pct: number;
  tone: "safe" | "warn" | "danger";
  remaining: number;
}

export function categoryBudgetUsage(transactions: Transaction[], budgets: Budgets): BudgetUsage[] {
  const currentExpenses = transactions.filter((t) => t.type === "expense" && isInCurrentMonth(t.date));
  return CATEGORIES.filter((category) => budgets.categories[category] > 0)
    .map((category) => {
      const spent = currentExpenses
        .filter((tx) => tx.category === category)
        .reduce((acc, tx) => acc + tx.amount, 0);
      const limit = budgets.categories[category];
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        category,
        spent,
        limit,
        pct,
        tone: budgetTone(pct),
        remaining: limit - spent,
      };
    })
    .sort((a, b) => b.pct - a.pct);
}

export interface BudgetAlert {
  id: string;
  label: string;
  spent: number;
  limit: number;
  pct: number;
  tone: "safe" | "warn" | "danger";
}

export function getBudgetAlerts(transactions: Transaction[], budgets: Budgets): BudgetAlert[] {
  const currentExpenses = transactions.filter((t) => t.type === "expense" && isInCurrentMonth(t.date));
  const totalSpent = currentExpenses.reduce((acc, tx) => acc + tx.amount, 0);
  const alerts: BudgetAlert[] = [];

  if (budgets.overall > 0) {
    const pct = Math.round((totalSpent / budgets.overall) * 100);
    if (pct >= 75) {
      alerts.push({
        id: "overall",
        label: "Overall monthly budget",
        spent: totalSpent,
        limit: budgets.overall,
        pct,
        tone: budgetTone(pct),
      });
    }
  }

  categoryBudgetUsage(transactions, budgets).forEach((usage) => {
    if (usage.pct >= 75) {
      alerts.push({
        id: usage.category,
        label: CATEGORY_META[usage.category].label,
        spent: usage.spent,
        limit: usage.limit,
        pct: usage.pct,
        tone: usage.tone,
      });
    }
  });

  return alerts.sort((a, b) => b.pct - a.pct);
}

export function expenseStats(transactions: Transaction[]) {
  const expenses = filterByRange(transactions, "month").filter((t) => t.type === "expense");
  const total = expenses.reduce((acc, tx) => acc + tx.amount, 0);
  const largest = expenses.reduce<Transaction | null>(
    (acc, tx) => (!acc || tx.amount > acc.amount ? tx : acc),
    null
  );
  const activeDays = new Set(expenses.map((tx) => tx.date)).size || 1;
  return {
    total,
    count: expenses.length,
    average: expenses.length ? total / expenses.length : 0,
    dailyAverage: total / activeDays,
    largest,
  };
}
