import { useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Download,
  Percent,
  ReceiptText,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Category, Filters, ViewKey } from "@/types";
import { useApp } from "@/lib/store";
import {
  buildCashflow,
  categoryBudgetUsage,
  getKpis,
  paymentBreakdown,
  spendingByCategory,
  weekdaySpend,
} from "@/lib/analytics";
import { CATEGORY_META, PAYMENT_META } from "@/lib/constants";
import { applyFilters, formatDate, formatMoney, isInCurrentMonth } from "@/lib/format";
import { exportTransactionsCSV } from "@/lib/transfer";
import { BudgetGauge, CashflowChart, CategoryDonut, WeekdaySpendChart } from "@/components/charts";
import { Badge, Button, Card, CardHeading, PageHeading, Progress, Segmented } from "@/components/ui";
import { cn } from "@/utils/cn";

const RANGE_LABEL = { week: "This week", month: "This month", all: "All time" } as const;

export function Analytics({
  filters,
  onFiltersChange,
  onNavigate,
}: {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onNavigate: (view: ViewKey) => void;
}) {
  const { transactions, budgets, settings, pushToast } = useApp();
  const currency = settings.currency;

  const scopedExpenses = useMemo(
    () => applyFilters(transactions, { ...filters, type: "expense" }),
    [transactions, filters]
  );
  const scopedIncome = useMemo(
    () => applyFilters(transactions, { ...filters, type: "income" }),
    [transactions, filters]
  );
  const cashflow = useMemo(
    () => buildCashflow(applyFilters(transactions, { ...filters, type: "All" }), filters.range, currency),
    [transactions, filters, currency]
  );
  const categoryData = useMemo(() => spendingByCategory(scopedExpenses, currency), [scopedExpenses, currency]);
  const weekdays = useMemo(() => weekdaySpend(scopedExpenses, currency), [scopedExpenses, currency]);
  const payments = useMemo(() => paymentBreakdown(scopedExpenses, currency), [scopedExpenses, currency]);
  const kpis = useMemo(() => getKpis(transactions, budgets), [transactions, budgets]);
  const budgetUsage = useMemo(() => categoryBudgetUsage(transactions, budgets), [transactions, budgets]);

  const totalExpenses = scopedExpenses.reduce((acc, tx) => acc + tx.amount, 0);
  const totalIncome = scopedIncome.reduce((acc, tx) => acc + tx.amount, 0);
  const largest = scopedExpenses.reduce<(typeof scopedExpenses)[number] | null>(
    (acc, tx) => (!acc || tx.amount > acc.amount ? tx : acc),
    null
  );
  const top = categoryData[0];
  const peakDay = weekdays.reduce((acc, day) => (day.value > acc.value ? day : acc), weekdays[0]);
  const distinctDays = new Set(scopedExpenses.map((tx) => tx.date)).size;
  const divisor = filters.range === "week" ? 7 : filters.range === "month" ? new Date().getDate() : Math.max(1, distinctDays);
  const dailyAverage = totalExpenses / divisor;
  const subscriptionSpend = transactions
    .filter((tx) => tx.type === "expense" && tx.category === "Subscriptions" && isInCurrentMonth(tx.date))
    .reduce((acc, tx) => acc + tx.amount, 0);
  const overallPct = kpis.budgetUsedPct;
  const gaugeTone = overallPct >= 90 ? "danger" : overallPct >= 75 ? "warn" : "safe";
  const rangeNet = totalIncome - totalExpenses;
  const activeCategory = filters.category !== "All";

  const openCategory = (category: Category) => {
    onFiltersChange({ ...filters, category, type: "expense", range: filters.range });
    onNavigate("transactions");
  };

  const exportReport = () => {
    if (!scopedExpenses.length) {
      pushToast({ tone: "warning", title: "No expenses to export", description: "Widen the range or clear filters first." });
      return;
    }
    exportTransactionsCSV(scopedExpenses, currency);
    pushToast({
      tone: "success",
      title: "Expense report exported",
      description: `${scopedExpenses.length} entries from ${RANGE_LABEL[filters.range].toLowerCase()} saved as CSV.`,
    });
  };

  const insights = [
    {
      icon: TrendingUp,
      tone: "text-emerald-500",
      title: top ? `${CATEGORY_META[top.category].label} leads your spend` : "No expense data yet",
      text: top
        ? `${top.pct}% of this period's spending, across ${top.count} ${top.count === 1 ? "transaction" : "transactions"}.`
        : "Log an expense to reveal your category mix and trends.",
    },
    {
      icon: Percent,
      tone: "text-sky-500",
      title: `Savings rate: ${Math.max(0, kpis.savingsRate)}% this month`,
      text:
        kpis.income > 0
          ? kpis.savingsRate >= 20
            ? "You're ahead of the 20% savings benchmark. Consider moving the surplus into an index fund."
            : `A 20% target would mean saving ${formatMoney(kpis.income * 0.2, currency)}. Trim flexible categories to close the gap.`
          : "Add an income entry to track your savings rate against spending.",
    },
    {
      icon: CalendarDays,
      tone: "text-amber-500",
      title: peakDay && peakDay.value > 0 ? `${peakDay.day} is your highest-spend day` : "Spending spread evenly",
      text:
        peakDay && peakDay.value > 0
          ? `${money(peakDay.value, currency)} of expenses land on ${peakDay.day}s in this period.`
          : "No weekday pattern detected for the selected period.",
    },
    {
      icon: RefreshCcw,
      tone: "text-violet-500",
      title: "Recurring subscriptions",
      text:
        subscriptionSpend > 0
          ? `${formatMoney(subscriptionSpend, currency)} billed this month — roughly ${formatMoney(subscriptionSpend * 12, currency)} a year. Audit unused plans.`
          : "No subscription expenses recorded this month. Keep it that way if you can.",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Intelligence"
        title="Financial insights"
        description="Understand the patterns behind your money and course-correct before the month ends."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={filters.range}
              onChange={(range) => onFiltersChange({ ...filters, range })}
              options={[
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
                { value: "all", label: "All" },
              ]}
              ariaLabel="Analytics period"
            />
            <Button variant="secondary" size="sm" onClick={exportReport}>
              <Download className="h-3.5 w-3.5" />
              Export report
            </Button>
          </div>
        }
      />

      {activeCategory || filters.query ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] px-3 py-2">
          <p className="text-[11px] text-muted">
            Viewing insights for
            {activeCategory ? <span className="ml-1 font-semibold text-ink">{CATEGORY_META[filters.category as Category].label}</span> : null}
            {filters.query ? (
              <span className="ml-1">
                search <span className="font-semibold text-ink">“{filters.query}”</span>
              </span>
            ) : null}
          </p>
          <button
            onClick={() => onFiltersChange({ ...filters, category: "All", query: "" })}
            className="ml-auto text-[11px] font-semibold text-indigo-500 hover:text-indigo-400"
          >
            Clear filter
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Savings rate",
            value: kpis.income > 0 ? `${Math.max(0, kpis.savingsRate)}%` : "—",
            hint: "This month",
            icon: Percent,
            classes: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
          },
          {
            label: "Avg daily spend",
            value: formatMoney(dailyAverage, currency, { compact: true }),
            hint: RANGE_LABEL[filters.range],
            icon: CalendarDays,
            classes: "bg-sky-500/10 text-sky-500 ring-sky-500/20",
          },
          {
            label: "Largest expense",
            value: largest ? formatMoney(largest.amount, currency) : "—",
            hint: largest ? largest.title : "No expenses",
            icon: ReceiptText,
            classes: "bg-rose-500/10 text-rose-500 ring-rose-500/20",
          },
          {
            label: "Top category",
            value: top ? CATEGORY_META[top.category].label.split(" ")[0] : "—",
            hint: top ? `${top.pct}% of spend` : "No data",
            icon: TrendingUp,
            classes: "bg-violet-500/10 text-violet-500 ring-violet-500/20",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", item.classes)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-faint">{item.label}</p>
              </div>
              <p className="mt-2 truncate font-display text-lg font-semibold tracking-tight text-ink tnum sm:text-xl">
                {item.value}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-faint">{item.hint}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-4 sm:p-5 xl:col-span-2">
          <CardHeading
            title="Cashflow trend"
            subtitle={`Income vs expenses · ${RANGE_LABEL[filters.range]}`}
            action={
              <Badge tone={rangeNet >= 0 ? "emerald" : "rose"}>
                Net {formatMoney(rangeNet, currency, { signed: true })}
              </Badge>
            }
          />
          <div className="mt-4">
            <CashflowChart data={cashflow} currency={currency} />
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <CardHeading
            title="Category mix"
            subtitle={`${formatMoney(totalExpenses, currency)} spent`}
            action={<Badge tone="indigo">{categoryData.length}</Badge>}
          />
          <div className="mt-3">
            <CategoryDonut
              data={categoryData}
              currency={currency}
              selected={activeCategory ? (filters.category as string) : null}
              onSelect={openCategory}
            />
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <CardHeading
            title="Weekday rhythm"
            subtitle="Where your week gets expensive"
            action={<Badge tone="sky">{peakDay?.day ?? "—"}</Badge>}
          />
          <div className="mt-2">
            <WeekdaySpendChart data={weekdays} currency={currency} />
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-faint">
            {peakDay && peakDay.value > 0
              ? `Most spending happens on ${peakDay.day}s. Batch discretionary purchases mid-week to smooth it out.`
              : "Not enough expense data for a weekday pattern."}
          </p>
        </Card>

        <Card className="p-4 sm:p-5">
          <CardHeading title="Payment methods" subtitle="How you pay for things" />
          <div className="mt-3 space-y-3">
            {payments.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-muted">No payments in this period.</p>
            ) : (
              payments.map((payment) => {
                const Icon = PAYMENT_META[payment.method].icon;
                return (
                  <div key={payment.method}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-2 text-muted ring-1 ring-inset ring-line">
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted">{payment.method}</span>
                      <span className="text-[11px] font-semibold text-ink tnum">{money(payment.value, currency)}</span>
                      <span className="w-7 text-right text-[10px] text-faint tnum">{payment.pct}%</span>
                    </div>
                    <Progress value={payment.pct} tone="indigo" height="h-1" className="mt-1.5" />
                  </div>
                );
              })
            )}
          </div>
          <p className="mt-3 border-t border-line/60 pt-2.5 text-[10px] text-faint">
            {payments[0] && payments[0].value > 0
              ? `${payments[0].method} is your default — ${payments[0].pct}% of expenses by value.`
              : "Add payment methods to transaction entries to see this split."}
          </p>
        </Card>

        <Card className="p-4 sm:p-5">
          <CardHeading
            title="Budget health"
            subtitle="Current month · all categories"
            action={<Wallet className="h-4 w-4 text-faint" />}
          />
          <BudgetGauge pct={overallPct} tone={gaugeTone} />
          <div className="space-y-1.5 border-t border-line/70 pt-3 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-faint">Monthly limit</span>
              <span className="font-semibold text-ink tnum">{formatMoney(budgets.overall, currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-faint">Spent</span>
              <span className="font-semibold text-ink tnum">{formatMoney(kpis.expenses, currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-faint">{kpis.remaining < 0 ? "Over by" : "Remaining"}</span>
              <span
                className={cn(
                  "font-semibold tnum",
                  kpis.remaining < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {formatMoney(Math.abs(kpis.remaining), currency)}
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {budgetUsage.slice(0, 3).map((usage) => (
              <div key={usage.category} className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-full", CATEGORY_META[usage.category].dot)} />
                <span className="min-w-0 flex-1 truncate text-[10px] text-muted">{usage.category}</span>
                <Progress
                  value={usage.pct}
                  tone={usage.tone === "danger" ? "rose" : usage.tone === "warn" ? "amber" : "emerald"}
                  height="h-1"
                  className="w-16"
                />
                <span className="w-7 text-right text-[10px] font-semibold text-faint tnum">{usage.pct}%</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate("budgets")}
            className="mt-3 flex w-full items-center justify-center gap-1 border-t border-line/60 pt-2.5 text-[10px] font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
          >
            Adjust budgets
            <ArrowRight className="h-3 w-3" />
          </button>
        </Card>

        <Card className="p-4 sm:p-5 xl:col-span-2">
          <CardHeading
            title="Category deep dive"
            subtitle={`${RANGE_LABEL[filters.range]} · share of expenses`}
            action={<Badge tone="slate">{scopedExpenses.length} entries</Badge>}
          />
          <div className="mt-2 divide-y divide-line/60">
            {categoryData.length === 0 ? (
              <p className="py-10 text-center text-[11px] text-muted">No expenses in this period yet.</p>
            ) : (
              categoryData.map((item) => {
                const meta = CATEGORY_META[item.category];
                const Icon = meta.icon;
                const monthlyLimit = budgets.categories[item.category];
                return (
                  <button
                    key={item.category}
                    onClick={() => openCategory(item.category)}
                    className="group flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", meta.soft)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] font-semibold text-ink">{meta.label}</p>
                        <p className="text-[11px] font-semibold text-ink tnum">{money(item.value, currency)}</p>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-full transition-[width] duration-700"
                          style={{ width: `${categoryData[0].value > 0 ? (item.value / categoryData[0].value) * 100 : 0}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <p className="mt-1 flex items-center justify-between gap-2 text-[10px] text-faint tnum">
                        <span>
                          {item.count} {item.count === 1 ? "transaction" : "transactions"} · {item.pct}% share
                        </span>
                        {monthlyLimit > 0 ? <span>Budget {formatMoney(monthlyLimit, currency)}</span> : <span>No limit</span>}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-faint transition-colors group-hover:text-emerald-500" />
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <CardHeading
            title="Smart insights"
            subtitle="Signals worth acting on"
            action={
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                <Sparkles className="h-3 w-3" />
              </span>
            }
          />
          <div className="mt-3 space-y-3">
            {insights.map((insight) => {
              const Icon = insight.icon;
              return (
                <div key={insight.title} className="flex gap-2.5">
                  <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-2 ring-1 ring-inset ring-line", insight.tone)}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-ink">{insight.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{insight.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 rounded-lg border border-line bg-surface-2/60 p-2.5">
            <p className="text-[10px] leading-relaxed text-faint tnum">
              Period income {formatMoney(totalIncome, currency)} · expenses {formatMoney(totalExpenses, currency)} · largest
              entry {largest ? `${largest.title} on ${formatDate(largest.date)}` : "—"}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function money(value: number, currency: "INR" | "USD"): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(value);
}
