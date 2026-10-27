import { useMemo, useState } from "react";
import { ArrowRight, Plus, Sparkles, TriangleAlert, X } from "lucide-react";
import type { Filters, Transaction, ViewKey } from "@/types";
import { useApp } from "@/lib/store";
import {
  buildCashflow,
  categoryBudgetUsage,
  getBudgetAlerts,
  getKpis,
  spendingByCategory,
} from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/constants";
import { applyFilters, formatMoney, greeting } from "@/lib/format";
import { CashflowChart, CategoryDonut, BudgetGauge } from "@/components/charts";
import { KpiCards } from "@/components/KpiCards";
import { TransactionList } from "@/components/TransactionList";
import { Badge, Button, Card, CardHeading, Progress, Segmented } from "@/components/ui";
import { cn } from "@/utils/cn";

const RANGE_OPTIONS = [
  { value: "week" as const, label: "Week" },
  { value: "month" as const, label: "Month" },
  { value: "all" as const, label: "All" },
];

const RANGE_SUBTITLE: Record<Filters["range"], string> = {
  week: "Last 7 days",
  month: "This month",
  all: "All time",
};

export function Dashboard({
  filters,
  onFiltersChange,
  onNavigate,
  onAdd,
  onEdit,
  onRequestDelete,
}: {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onNavigate: (view: ViewKey) => void;
  onAdd: () => void;
  onEdit: (tx: Transaction) => void;
  onRequestDelete: (tx: Transaction) => void;
}) {
  const { transactions, budgets, settings } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const currency = settings.currency;

  const kpis = useMemo(() => getKpis(transactions, budgets), [transactions, budgets]);
  const alerts = useMemo(() => getBudgetAlerts(transactions, budgets), [transactions, budgets]);
  const usage = useMemo(() => categoryBudgetUsage(transactions, budgets), [transactions, budgets]);

  // Dashboard visualisations always show the full picture for the selected
  // period; category/query filters only narrow the recent activity list.
  const chartData = useMemo(
    () =>
      buildCashflow(
        applyFilters(transactions, { range: filters.range, category: "All", type: "All", query: "" }),
        filters.range,
        currency
      ),
    [transactions, filters.range, currency]
  );

  const categoryData = useMemo(
    () =>
      spendingByCategory(
        applyFilters(transactions, { range: filters.range, category: "All", type: "expense", query: "" }),
        currency
      ),
    [transactions, filters.range, currency]
  );

  const recent = useMemo(() => applyFilters(transactions, filters).slice(0, 5), [transactions, filters]);
  const recentTotal = recent.length;
  const firstName = settings.name.split(" ")[0] || "there";
  const topAlert = alerts[0];
  const overallPct = Math.round(kpis.budgetUsedPct);
  const gaugeTone = overallPct >= 90 ? "danger" : overallPct >= 75 ? "warn" : "safe";
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {today}
          </div>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
            {greeting()},{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="mt-1 max-w-xl text-[13px] text-muted sm:text-sm">
            You&apos;ve spent{" "}
            <span className="font-semibold text-ink tnum">{formatMoney(kpis.expenses, currency)}</span> this month across{" "}
            {kpis.txnCount} entries —{" "}
            <span className={cn("font-semibold tnum", kpis.remaining < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400")}>
              {formatMoney(Math.abs(kpis.remaining), currency)}
            </span>{" "}
            {kpis.remaining < 0 ? "over budget" : "left to spend"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => onNavigate("analytics")} className="hidden sm:inline-flex">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            View insights
          </Button>
          <Button variant="primary" onClick={onAdd}>
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            Add transaction
          </Button>
        </div>
      </div>

      {topAlert && !dismissed ? (
        <div
          role="status"
          className={cn(
            "relative flex flex-wrap items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-3 pr-10",
            topAlert.tone === "danger"
              ? "border-rose-500/25 bg-gradient-to-r from-rose-500/[0.09] to-transparent"
              : "border-amber-500/25 bg-gradient-to-r from-amber-500/[0.09] to-transparent"
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
              topAlert.tone === "danger"
                ? "bg-rose-500/10 text-rose-500 ring-rose-500/20"
                : "bg-amber-500/10 text-amber-500 ring-amber-500/20"
            )}
          >
            <TriangleAlert className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-ink">
              {topAlert.pct >= 100 ? "Budget exceeded" : "Slow down on spending"} · {topAlert.label}
            </p>
            <p className="mt-0.5 text-[11px] text-muted tnum">
              {formatMoney(topAlert.spent, currency)} of {formatMoney(topAlert.limit, currency)} used ({topAlert.pct}%).
              {topAlert.tone === "danger" ? " Consider adjusting your limit." : " You're approaching the limit."}
            </p>
          </div>
          <button
            onClick={() => onNavigate("budgets")}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface/70 px-2.5 py-1.5 text-[11px] font-semibold text-ink transition-colors hover:border-line-strong"
          >
            Review budgets
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss alert"
            className="absolute right-2 top-2 rounded p-1 text-faint transition-colors hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <KpiCards kpis={kpis} currency={currency} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-4 sm:p-5 xl:col-span-2">
          <CardHeading
            title="Cashflow trend"
            subtitle={`Income vs expenses · ${RANGE_SUBTITLE[filters.range]}`}
            action={<Segmented value={filters.range} onChange={(range) => onFiltersChange({ ...filters, range })} options={RANGE_OPTIONS} size="sm" ariaLabel="Cashflow period" />}
          />
          <div className="mt-4">
            <CashflowChart data={chartData} currency={currency} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3 text-[11px]">
            <span className="text-muted">
              Net cashflow this period:{" "}
              <span
                className={cn(
                  "font-semibold tnum",
                  chartData.reduce((acc, point) => acc + point.net, 0) >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-500"
                )}
              >
                {formatMoney(
                  chartData.reduce((acc, point) => acc + point.income - point.expenses, 0),
                  currency,
                  { signed: true }
                )}
              </span>
            </span>
            <button
              onClick={() => onNavigate("analytics")}
              className="flex items-center gap-1 font-semibold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
            >
              Full report
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

        <Card className="flex flex-col p-4 sm:p-5">
          <CardHeading
            title="Spending breakdown"
            subtitle={RANGE_SUBTITLE[filters.range]}
            action={<Badge tone="indigo">{categoryData.length} categories</Badge>}
          />
          <div className="mt-3 flex-1">
            <CategoryDonut
              data={categoryData}
              currency={currency}
              selected={filters.category === "All" ? null : filters.category}
              onSelect={(category) => {
                onFiltersChange({ ...filters, category, type: "expense" });
                onNavigate("transactions");
              }}
            />
          </div>
          <div className="mt-3 border-t border-line/70 pt-2.5">
            <p className="text-[10px] leading-relaxed text-faint">
              Tap a category to inspect its transactions. Expenses only.
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 sm:pb-3">
            <CardHeading
              title="Recent activity"
              subtitle={`${recentTotal} shown · ${RANGE_SUBTITLE[filters.range]}`}
            />
            <div className="flex items-center gap-2">
              <Segmented
                value={filters.type}
                onChange={(type) => onFiltersChange({ ...filters, type })}
                options={[
                  { value: "All", label: "All" },
                  { value: "expense", label: "Expenses" },
                  { value: "income", label: "Income" },
                ]}
                size="sm"
                ariaLabel="Filter by type"
              />
            </div>
          </div>
          <div className="border-t border-line/60">
            <TransactionList
              transactions={recent}
              compact
              onEdit={onEdit}
              onDelete={onRequestDelete}
              emptyQuery={Boolean(filters.query) || filters.type !== "All" || filters.category !== "All"}
              emptyAction={
                <Button variant="primary" size="sm" onClick={onAdd}>
                  <Plus className="h-3.5 w-3.5" />
                  Add transaction
                </Button>
              }
            />
          </div>
          <button
            onClick={() => onNavigate("transactions")}
            className="flex w-full items-center justify-center gap-1.5 border-t border-line/60 py-2.5 text-[11px] font-semibold text-muted transition-colors hover:bg-surface-2/60 hover:text-ink"
          >
            View all transactions
            <ArrowRight className="h-3 w-3" />
          </button>
        </Card>

        <Card className="flex flex-col p-4 sm:p-5">
          <CardHeading
            title="Budget pulse"
            subtitle={`${overallPct}% of ${formatMoney(budgets.overall, currency)} used`}
            action={
              <button
                onClick={() => onNavigate("budgets")}
                className="text-[11px] font-semibold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
              >
                Manage
              </button>
            }
          />
          <div className="mt-1">
            <BudgetGauge pct={Math.min(overallPct, 999)} tone={gaugeTone} />
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-faint">Spent</span>
            <span className="font-semibold text-ink tnum">{formatMoney(kpis.expenses, currency)}</span>
          </div>
          <div className="mt-3 space-y-3 border-t border-line/70 pt-3">
            {usage.slice(0, 3).map((item) => {
              const meta = CATEGORY_META[item.category];
              const Icon = meta.icon;
              return (
                <button
                  key={item.category}
                  onClick={() => {
                    onFiltersChange({ ...filters, category: item.category, type: "expense", range: "month" });
                    onNavigate("budgets");
                  }}
                  className="block w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-md ring-1 ring-inset", meta.soft)}>
                      <Icon className="h-3 w-3" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted">{item.category}</span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold tnum",
                        item.tone === "danger" ? "text-rose-500" : item.tone === "warn" ? "text-amber-500" : "text-emerald-500"
                      )}
                    >
                      {item.pct}%
                    </span>
                  </div>
                  <Progress
                    value={item.pct}
                    tone={item.tone === "danger" ? "rose" : item.tone === "warn" ? "amber" : "emerald"}
                    height="h-1"
                    className="mt-1.5"
                  />
                </button>
              );
            })}
            {usage.length === 0 ? (
              <p className="text-[11px] text-muted">No category budgets configured yet.</p>
            ) : null}
          </div>
          <button
            onClick={() => onNavigate("budgets")}
            className="mt-auto flex w-full items-center justify-center gap-1.5 pt-4 text-[11px] font-semibold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
          >
            Set category limits
            <ArrowRight className="h-3 w-3" />
          </button>
        </Card>
      </div>
    </div>
  );
}
