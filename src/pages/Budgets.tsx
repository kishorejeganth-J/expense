import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Lightbulb, RotateCcw, Save, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import type { Budgets as BudgetsType, Category } from "@/types";
import { useApp } from "@/lib/store";
import { DEFAULT_BUDGETS, EXPENSE_CATEGORIES, CATEGORY_META } from "@/lib/constants";
import {
  budgetTone,
  formatMoney,
  isInCurrentMonth,
  monthLabel,
  toBase,
  toDisplay,
} from "@/lib/format";
import { getBudgetAlerts } from "@/lib/analytics";
import { BudgetGauge } from "@/components/charts";
import { Badge, Button, Card, CardHeading, PageHeading, Progress } from "@/components/ui";
import { cn } from "@/utils/cn";

function parseInput(text: string, currency: "INR" | "USD"): number {
  const numeric = Number(text.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(toBase(numeric, currency));
}

export function Budgets({ onAdd }: { onAdd: () => void }) {
  const { transactions, budgets, saveBudgets, settings, pushToast } = useApp();
  const currency = settings.currency;
  const [draft, setDraft] = useState<BudgetsType>(budgets);
  const [overallText, setOverallText] = useState(String(Math.round(toDisplay(budgets.overall, currency))));
  const [categoryTexts, setCategoryTexts] = useState<Record<string, string>>({});

  const buildTexts = (source: BudgetsType, curr: "INR" | "USD") =>
    Object.fromEntries(
      EXPENSE_CATEGORIES.map((category) => [category, String(Math.round(toDisplay(source.categories[category], curr)))])
    );

  useEffect(() => {
    setDraft(budgets);
    setOverallText(String(Math.round(toDisplay(budgets.overall, currency))));
    setCategoryTexts(buildTexts(budgets, currency));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets, currency]);

  const spendByCategory = useMemo(() => {
    const map = new Map<Category, number>();
    transactions
      .filter((tx) => tx.type === "expense" && isInCurrentMonth(tx.date))
      .forEach((tx) => map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount));
    return map;
  }, [transactions]);

  const totalSpent = useMemo(
    () => transactions.filter((tx) => tx.type === "expense" && isInCurrentMonth(tx.date)).reduce((acc, tx) => acc + tx.amount, 0),
    [transactions]
  );

  const overallPct = draft.overall > 0 ? Math.round((totalSpent / draft.overall) * 100) : 0;
  const overallTone = draft.overall > 0 ? budgetTone(overallPct) : "safe";
  const allocated = EXPENSE_CATEGORIES.reduce((acc, category) => acc + draft.categories[category], 0);
  const unallocated = draft.overall - allocated;
  const overAllocated = draft.overall > 0 && unallocated < 0;
  const dirty = JSON.stringify(draft) !== JSON.stringify(budgets);
  const alerts = useMemo(() => getBudgetAlerts(transactions, budgets), [transactions, budgets]);

  const rows = EXPENSE_CATEGORIES.map((category) => {
    const spent = spendByCategory.get(category) ?? 0;
    const limit = draft.categories[category];
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return { category, spent, limit, pct, tone: budgetTone(pct), remaining: limit - spent };
  }).sort((a, b) => b.pct - a.pct);

  const updateOverall = (text: string) => {
    setOverallText(text);
    setDraft((prev) => ({ ...prev, overall: parseInput(text, currency) }));
  };

  const updateCategory = (category: Category, text: string) => {
    setCategoryTexts((prev) => ({ ...prev, [category]: text }));
    setDraft((prev) => ({
      ...prev,
      categories: { ...prev.categories, [category]: parseInput(text, currency) },
    }));
  };

  const discard = () => {
    setDraft(budgets);
    setOverallText(String(Math.round(toDisplay(budgets.overall, currency))));
    setCategoryTexts(buildTexts(budgets, currency));
    pushToast({ tone: "info", title: "Changes discarded", description: "Your saved budget limits are unchanged." });
  };

  const save = () => {
    if (overAllocated) {
      pushToast({
        tone: "warning",
        title: "Category limits exceed overall budget",
        description: "Lower a category limit or raise your overall monthly cap before saving.",
      });
      return;
    }
    saveBudgets(draft);
    pushToast({
      tone: "success",
      title: "Budgets updated",
      description: `Overall limit set to ${formatMoney(draft.overall, currency)} for ${monthLabel()}.`,
    });
  };

  const applyRecommended = () => {
    setDraft(DEFAULT_BUDGETS);
    setOverallText(String(Math.round(toDisplay(DEFAULT_BUDGETS.overall, currency))));
    setCategoryTexts(buildTexts(DEFAULT_BUDGETS, currency));
    pushToast({ tone: "info", title: "Recommended limits loaded", description: "Review the amounts, then save to apply them." });
  };

  const statusLabel =
    draft.overall === 0
      ? "Not set"
      : overallPct >= 100
        ? "Over budget"
        : overallPct >= 90
          ? "Critical"
          : overallPct >= 75
            ? "Watch closely"
            : "On track";

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Planning"
        title="Budgets & limits"
        description={`Set guardrails for ${monthLabel()}. Limits apply to expenses only and reset on the 1st of each month.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {dirty ? (
              <Badge tone="amber" className="h-7 px-2.5">
                Unsaved changes
              </Badge>
            ) : null}
            <Button variant="secondary" size="sm" onClick={discard} disabled={!dirty}>
              <RotateCcw className="h-3.5 w-3.5" />
              Discard
            </Button>
            <Button variant="primary" size="sm" onClick={save} disabled={!dirty}>
              <Save className="h-3.5 w-3.5" />
              Save budgets
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="relative overflow-hidden p-4 sm:p-5">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl"
              aria-hidden="true"
            />
            <CardHeading
              title="Overall monthly limit"
              subtitle="Total spending cap across every category"
              action={
                <Badge tone={overallTone === "danger" ? "rose" : overallTone === "warn" ? "amber" : "emerald"}>
                  {statusLabel}
                </Badge>
              }
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium text-muted">
                  {draft.overall === 0
                    ? "No overall cap"
                    : overallPct > 100
                      ? "Over budget by"
                      : "Remaining to spend"}
                </p>
                <p
                  className={cn(
                    "mt-1 font-display text-[26px] font-semibold tracking-tight tnum sm:text-[30px]",
                    overallPct > 100 ? "text-rose-500" : "text-ink"
                  )}
                >
                  {formatMoney(draft.overall === 0 ? totalSpent : Math.abs(draft.overall - totalSpent), currency)}
                </p>
                <p className="mt-1 text-[11px] text-faint tnum">
                  Spent {formatMoney(totalSpent, currency)} of {formatMoney(draft.overall, currency)}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="overall-limit" className="mb-1 block text-[11px] font-medium text-muted">
                    Limit ({currency})
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-faint">
                      {currency === "INR" ? "₹" : "$"}
                    </span>
                    <input
                      id="overall-limit"
                      inputMode="decimal"
                      value={overallText}
                      onChange={(event) => updateOverall(event.target.value.replace(/[^\d.]/g, ""))}
                      className="h-10 w-full rounded-xl border border-line bg-surface-2/70 pl-7 pr-12 text-sm font-semibold text-ink tnum transition-colors focus:border-emerald-500/60 focus:outline-none"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-faint">
                      /month
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-faint">Allocated to categories</span>
                  <span className={cn("font-semibold tnum", overAllocated ? "text-rose-500" : "text-ink")}>
                    {formatMoney(allocated, currency)}
                  </span>
                </div>
                <Progress
                  value={draft.overall > 0 ? (allocated / draft.overall) * 100 : 0}
                  tone={overAllocated ? "rose" : "indigo"}
                  height="h-1"
                />
                <p className="text-[10px] text-faint">
                  {overAllocated
                    ? `${formatMoney(Math.abs(unallocated), currency)} over your overall cap — adjust before saving.`
                    : `${formatMoney(unallocated, currency)} unallocated flexible buffer.`}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-line/70 pt-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-faint">Overall budget used</span>
                <span
                  className={cn(
                    "font-semibold tnum",
                    overallTone === "danger" ? "text-rose-500" : overallTone === "warn" ? "text-amber-500" : "text-emerald-500"
                  )}
                >
                  {overallPct}%
                </span>
              </div>
              <Progress
                value={overallPct}
                tone={overallTone === "danger" ? "rose" : overallTone === "warn" ? "amber" : "emerald"}
                className="mt-2"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-faint">
                  Alerts trigger at 75% (amber) and 90% (rose) of any limit.
                </p>
                <button
                  onClick={applyRecommended}
                  className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
                >
                  <Sparkles className="h-3 w-3" />
                  Use recommended limits
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeading
              title="Category limits"
              subtitle="Fine-tune where your money goes each month"
              action={
                <span className="text-[11px] text-faint tnum">
                  {formatMoney(allocated, currency)} allocated
                </span>
              }
            />
            <div className="mt-2 divide-y divide-line/60">
              {rows.map((row) => {
                const meta = CATEGORY_META[row.category];
                const Icon = meta.icon;
                return (
                  <div key={row.category} className="flex flex-col gap-2.5 py-3.5 first:pt-3 sm:flex-row sm:items-center sm:gap-3">
                    <span className={cn("hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset sm:flex", meta.soft)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                          <span className={cn("h-1.5 w-1.5 rounded-full sm:hidden", meta.dot)} />
                          {meta.label}
                        </p>
                        <span
                          className={cn(
                            "text-[11px] font-semibold tnum sm:hidden",
                            row.limit === 0 ? "text-faint" : row.tone === "danger" ? "text-rose-500" : row.tone === "warn" ? "text-amber-500" : "text-emerald-500"
                          )}
                        >
                          {row.limit === 0 ? "Not budgeted" : `${row.pct}%`}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress
                          value={row.limit === 0 ? 0 : row.pct}
                          tone={row.limit === 0 ? "emerald" : row.tone === "danger" ? "rose" : row.tone === "warn" ? "amber" : "emerald"}
                          height="h-1.5"
                          className="flex-1"
                        />
                        <span className="hidden w-20 text-right text-[10px] text-faint tnum sm:block">
                          {formatMoney(row.spent, currency)} / {row.limit > 0 ? formatMoney(row.limit, currency) : "—"}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-faint tnum">
                        {row.limit === 0
                          ? `${formatMoney(row.spent, currency)} spent without a limit`
                          : row.remaining >= 0
                            ? `${formatMoney(row.remaining, currency)} left this month`
                            : `${formatMoney(Math.abs(row.remaining), currency)} over the limit`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:w-auto">
                      <div className="relative w-full sm:w-[128px]">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-faint">
                          {currency === "INR" ? "₹" : "$"}
                        </span>
                        <input
                          inputMode="decimal"
                          aria-label={`${meta.label} budget in ${currency}`}
                          value={categoryTexts[row.category] ?? ""}
                          onChange={(event) => updateCategory(row.category, event.target.value.replace(/[^\d.]/g, ""))}
                          className="h-9 w-full rounded-lg border border-line bg-surface-2/70 pl-6 pr-9 text-xs font-semibold text-ink tnum transition-colors focus:border-emerald-500/60 focus:outline-none"
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-faint">
                          /mo
                        </span>
                      </div>
                      <span
                        className={cn(
                          "hidden w-12 text-right text-[11px] font-semibold tnum lg:block",
                          row.limit === 0 ? "text-faint" : row.tone === "danger" ? "text-rose-500" : row.tone === "warn" ? "text-amber-500" : "text-emerald-500"
                        )}
                      >
                        {row.limit === 0 ? "—" : `${row.pct}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-1 border-t border-line/60 pt-3 text-[10px] leading-relaxed text-faint">
              Income is not capped. A zero limit means the category is tracked but not budgeted.
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <CardHeading title="Budget health" subtitle={monthLabel()} action={<Wallet className="h-4 w-4 text-faint" />} />
            <div className="mt-1">
              <BudgetGauge pct={overallPct} tone={overallTone} />
            </div>
            <div className="flex items-center justify-between border-t border-line/70 pt-3 text-[11px]">
              <span className="text-faint">Total spend</span>
              <span className="font-semibold text-ink tnum">{formatMoney(totalSpent, currency)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-faint">{overallPct > 100 ? "Over budget" : "Remaining"}</span>
              <span
                className={cn(
                  "font-semibold tnum",
                  overallPct > 100 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {formatMoney(Math.abs(draft.overall - totalSpent), currency)}
              </span>
            </div>
            <div className="mt-3 rounded-lg border border-line bg-surface-2/60 p-2.5">
              <p className="text-[10px] leading-relaxed text-muted">
                {overallPct >= 90
                  ? "You're close to your monthly ceiling. Consider pausing non-essential purchases."
                  : overallPct >= 75
                    ? "You're in the watch zone. Keep an eye on dining and shopping for the rest of the month."
                    : "Nice pacing — your spending is comfortably inside the monthly limit."}
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeading
              title="Active alerts"
              subtitle="Thresholds at 75% and 90%"
              action={alerts.length > 0 ? <Badge tone="amber">{alerts.length}</Badge> : <Badge tone="emerald">Clear</Badge>}
            />
            <div className="mt-3 space-y-3">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center py-5 text-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  <p className="mt-2 text-xs font-semibold text-ink">All budgets are healthy</p>
                  <p className="mt-1 text-[11px] text-muted">No category is above 75% of its limit.</p>
                </div>
              ) : (
                alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-ink">
                        <AlertTriangle
                          className={cn("h-3 w-3 shrink-0", alert.tone === "danger" ? "text-rose-500" : "text-amber-500")}
                        />
                        <span className="truncate">{alert.label}</span>
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-semibold tnum",
                          alert.tone === "danger" ? "text-rose-500" : "text-amber-500"
                        )}
                      >
                        {alert.pct}%
                      </span>
                    </div>
                    <Progress
                      value={alert.pct}
                      tone={alert.tone === "danger" ? "rose" : "amber"}
                      height="h-1"
                      className="mt-1.5"
                    />
                    <p className="mt-1 text-[10px] text-faint tnum">
                      {formatMoney(alert.spent, currency)} of {formatMoney(alert.limit, currency)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <p className="mt-3 border-t border-line/60 pt-3 text-[10px] text-faint">
              Alerts reflect saved limits. Save your changes to update them.
            </p>
          </Card>

          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] to-transparent p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
                <Lightbulb className="h-3.5 w-3.5" />
              </span>
              <p className="font-display text-xs font-semibold text-ink">A simple rule of thumb</p>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Try the <span className="font-semibold text-ink">50 / 30 / 20</span> split: half of your income for needs,
              30% for wants, and 20% toward savings. Keep flexible categories — shopping and dining — on the tighter end.
            </p>
            <div className="mt-3 space-y-2">
              {[
                { label: "Needs", pct: 50, tone: "emerald" as const },
                { label: "Wants", pct: 30, tone: "indigo" as const },
                { label: "Savings", pct: 20, tone: "sky" as const },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-12 text-[10px] font-medium text-muted">{item.label}</span>
                  <Progress value={item.pct} tone={item.tone} height="h-1" className="flex-1" />
                  <span className="w-7 text-right text-[10px] font-semibold text-faint tnum">{item.pct}%</span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={onAdd} className="mt-3 w-full">
              Log an expense
            </Button>
          </Card>

          {overAllocated ? (
            <Card className="border-rose-500/25 bg-rose-500/[0.05] p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-500">
                <ShieldAlert className="h-3.5 w-3.5" />
                Fix before saving
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted">
                Category limits total {formatMoney(allocated, currency)}, which is more than your overall limit. Lower a
                category or raise the monthly cap.
              </p>
            </Card>
          ) : null}
        </div>
      </div>

      {dirty ? (
        <div className="sticky bottom-20 z-20 lg:bottom-4">
          <Card className="flex flex-wrap items-center justify-between gap-2 border-emerald-500/25 bg-surface/95 p-3 shadow-2xl shadow-slate-950/20">
            <p className="text-[11px] font-medium text-muted">
              You have unsaved budget changes.
              {overAllocated ? <span className="ml-1 text-rose-500">Category limits exceed the overall cap.</span> : null}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={discard}>
                Discard
              </Button>
              <Button variant="primary" size="sm" onClick={save}>
                <Save className="h-3.5 w-3.5" />
                Save budgets
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
