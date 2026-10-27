import { ArrowDownLeft, ArrowUpRight, PiggyBank, TrendingDown, Wallet } from "lucide-react";
import type { KpiSummary } from "@/lib/analytics";
import type { Currency } from "@/types";
import { formatMoney } from "@/lib/format";
import { Card, DeltaBadge, Progress } from "@/components/ui";
import { cn } from "@/utils/cn";

export function KpiCards({ kpis, currency }: { kpis: KpiSummary; currency: Currency }) {
  const used = Math.max(0, Math.min(100, kpis.budgetUsedPct));
  const tone = used >= 90 ? "rose" : used >= 75 ? "amber" : "emerald";
  const overBudget = kpis.remaining < 0;

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/[0.13] via-surface to-surface p-4 balance-glow sm:p-5">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-500/15 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Total balance</span>
          </div>
          <DeltaBadge value={kpis.balanceDelta} />
        </div>
        <p className="relative mt-3 font-display text-[26px] font-semibold leading-none tracking-tight text-ink tnum sm:text-[28px]">
          {formatMoney(kpis.balance, currency)}
        </p>
        <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-line/70 pt-2.5">
          <span className="text-[11px] text-faint">Savings rate this month</span>
          <span
            className={cn(
              "text-[11px] font-semibold tnum",
              kpis.savingsRate >= 20 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"
            )}
          >
            {Math.max(0, kpis.savingsRate)}%
          </span>
        </div>
      </Card>

      <Card className="group relative overflow-hidden p-4 transition-colors hover:border-emerald-500/25 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Income</span>
          </div>
          <DeltaBadge value={kpis.incomeDelta} />
        </div>
        <p className="mt-3 font-display text-[26px] font-semibold leading-none tracking-tight text-ink tnum sm:text-[28px]">
          {formatMoney(kpis.income, currency)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/70 pt-2.5">
          <span className="text-[11px] text-faint">vs previous month</span>
          <span className="text-[11px] font-medium text-muted">{kpis.txnCount} transactions logged</span>
        </div>
      </Card>

      <Card className="group relative overflow-hidden p-4 transition-colors hover:border-indigo-500/25 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-400">
              <TrendingDown className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Expenses</span>
          </div>
          <DeltaBadge value={kpis.expenseDelta} invert />
        </div>
        <p className="mt-3 font-display text-[26px] font-semibold leading-none tracking-tight text-ink tnum sm:text-[28px]">
          {formatMoney(kpis.expenses, currency)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/70 pt-2.5">
          <span className="text-[11px] text-faint">{kpis.budgetUsedPct}% of monthly budget</span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted">
            <ArrowUpRight className="h-3 w-3 text-faint" />
            {formatMoney(kpis.overallBudget, currency, { compact: true })} cap
          </span>
        </div>
      </Card>

      <Card className="group relative overflow-hidden p-4 transition-colors hover:border-amber-500/25 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400">
              <PiggyBank className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Remaining budget</span>
          </div>
          <DeltaBadge value={kpis.remainingDelta} />
        </div>
        <p
          className={cn(
            "mt-3 font-display text-[26px] font-semibold leading-none tracking-tight tnum sm:text-[28px]",
            overBudget ? "text-rose-500" : "text-ink"
          )}
        >
          {formatMoney(kpis.remaining, currency)}
        </p>
        <div className="mt-3 border-t border-line/70 pt-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-faint">{overBudget ? "Over budget by" : "Used this month"}</span>
            <span
              className={cn(
                "font-semibold tnum",
                tone === "rose" ? "text-rose-500" : tone === "amber" ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {kpis.budgetUsedPct}%
            </span>
          </div>
          <Progress value={used} tone={tone} className="mt-2" />
        </div>
      </Card>
    </div>
  );
}
