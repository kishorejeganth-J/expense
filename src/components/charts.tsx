import { useState } from "react";
import { PieChart as PieIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashflowPoint, CategorySpend } from "@/lib/analytics";
import type { Currency } from "@/types";
import { CATEGORY_META } from "@/lib/constants";
import { useApp } from "@/lib/store";
import { cn } from "@/utils/cn";

export function moneyDisplay(value: number, currency: Currency, compact = false): string {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
      minimumFractionDigits: compact ? 0 : 0,
    }).format(value);
  } catch {
    return `${currency === "INR" ? "₹" : "$"}${value.toLocaleString()}`;
  }
}

function chartPalette(isDark: boolean) {
  return {
    grid: isDark ? "#1a2436" : "#e9edf4",
    tick: isDark ? "#64748b" : "#8b97ab",
    cursor: isDark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.05)",
  };
}

interface TipPayload {
  name?: string;
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface TipProps {
  active?: boolean;
  payload?: TipPayload[];
  currency: Currency;
}

function CashflowTooltip({ active, payload, currency }: TipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as unknown as CashflowPoint | undefined;
  return (
    <div className="min-w-[168px] rounded-xl border border-line bg-surface/95 px-3 py-2.5 shadow-xl shadow-slate-950/25 backdrop-blur-md">
      <p className="mb-1.5 text-[11px] font-semibold text-ink">{point?.fullLabel ?? "—"}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.dataKey === "income" ? "Income" : "Expenses"}
            </span>
            <span className="font-semibold text-ink tnum">{moneyDisplay(Number(entry.value ?? 0), currency)}</span>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between gap-4 border-t border-line pt-1.5 text-[11px]">
          <span className="text-faint">Net</span>
          <span
            className={cn("font-semibold tnum", (point?.net ?? 0) >= 0 ? "text-emerald-500" : "text-rose-500")}
          >
            {moneyDisplay(point?.net ?? 0, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CashflowChart({ data, currency }: { data: CashflowPoint[]; currency: Currency }) {
  const { settings } = useApp();
  const palette = chartPalette(settings.theme === "dark");
  const [visible, setVisible] = useState<{ income: boolean; expenses: boolean }>({
    income: true,
    expenses: true,
  });

  const totals = data.reduce(
    (acc, point) => ({
      income: acc.income + point.income,
      expenses: acc.expenses + point.expenses,
    }),
    { income: 0, expenses: 0 }
  );

  const series = [
    { key: "income" as const, label: "Income", color: "#10b981", total: totals.income },
    { key: "expenses" as const, label: "Expenses", color: "#818cf8", total: totals.expenses },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {series.map((item) => (
          <button
            key={item.key}
            onClick={() => setVisible((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
            aria-pressed={visible[item.key]}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-medium transition-opacity",
              visible[item.key] ? "opacity-100" : "opacity-40"
            )}
          >
            <span
              className="h-2 w-2 rounded-full ring-2 ring-transparent transition-all"
              style={{ backgroundColor: visible[item.key] ? item.color : "transparent", boxShadow: `inset 0 0 0 1.5px ${item.color}` }}
            />
            <span className="text-muted">{item.label}</span>
            <span className="font-semibold text-ink tnum">
              {moneyDisplay(item.key === "income" ? totals.income : totals.expenses, currency, true)}
            </span>
          </button>
        ))}
      </div>

      <div className="h-[248px] w-full sm:h-[268px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.30} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={palette.grid} strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: palette.tick, fontSize: 10 }}
              tickMargin={10}
              minTickGap={22}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={58}
              tick={{ fill: palette.tick, fontSize: 10 }}
              tickFormatter={(value: number) => moneyDisplay(value, currency, true)}
            />
            <Tooltip
              content={<CashflowTooltip currency={currency} />}
              cursor={{ stroke: palette.grid, strokeWidth: 1 }}
            />
            {visible.income ? (
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2.2}
                fill="url(#incomeFill)"
                activeDot={{ r: 3.5, fill: "#10b981", stroke: "#052e23", strokeWidth: 2 }}
                dot={false}
              />
            ) : null}
            {visible.expenses ? (
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#818cf8"
                strokeWidth={2.2}
                fill="url(#expenseFill)"
                activeDot={{ r: 3.5, fill: "#818cf8", stroke: "#1e1b4b", strokeWidth: 2 }}
                dot={false}
              />
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DonutTooltip({ active, payload, currency }: TipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const data = entry?.payload as unknown as CategorySpend | undefined;
  if (!data) return null;
  return (
    <div className="rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-xl shadow-slate-950/25 backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }} />
        <p className="text-[11px] font-semibold text-ink">{CATEGORY_META[data.category].label}</p>
      </div>
      <p className="mt-1 text-sm font-semibold text-ink tnum">{moneyDisplay(data.value, currency)}</p>
      <p className="text-[10px] text-faint">
        {data.pct}% of spending · {data.count} {data.count === 1 ? "transaction" : "transactions"}
      </p>
    </div>
  );
}

export function CategoryDonut({
  data,
  currency,
  onSelect,
  selected,
}: {
  data: CategorySpend[];
  currency: Currency;
  onSelect?: (category: CategorySpend["category"]) => void;
  selected?: string | null;
}) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const count = data.reduce((acc, item) => acc + item.count, 0);

  if (!data.length) {
    return (
      <div className="flex h-[330px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-faint">
          <PieIcon size={20} />
        </div>
        <p className="mt-3 text-xs font-semibold text-ink">No spending to break down</p>
        <p className="mt-1 max-w-[200px] text-[11px] text-muted">Add an expense in this period to see your category mix.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mx-auto h-[188px] w-full max-w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="category"
              innerRadius="67%"
              outerRadius="96%"
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={entry.color}
                  opacity={selected && selected !== entry.category ? 0.35 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-faint">Spent</p>
          <p className="mt-0.5 font-display text-xl font-semibold tracking-tight text-ink tnum">
            {moneyDisplay(total, currency, total >= 100000)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted">
            {count} {count === 1 ? "transaction" : "transactions"}
          </p>
        </div>
      </div>

      <div className="mt-2 space-y-0.5">
        {data.map((entry) => {
          const active = selected === entry.category;
          return (
            <button
              key={entry.category}
              onClick={() => onSelect?.(entry.category)}
              disabled={!onSelect}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors",
                onSelect && "hover:bg-surface-2",
                active && "bg-surface-2",
                !onSelect && "cursor-default"
              )}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted">
                {CATEGORY_META[entry.category].label}
              </span>
              <span className="text-[11px] font-semibold text-ink tnum">{moneyDisplay(entry.value, currency)}</span>
              <span className="w-7 text-right text-[10px] text-faint tnum">{entry.pct}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SimpleBarTooltip({ active, payload, currency }: TipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as unknown as { day?: string } | undefined;
  return (
    <div className="rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-xl shadow-slate-950/25 backdrop-blur-md">
      <p className="text-[11px] font-semibold text-ink">{point?.day ?? "—"}</p>
      <p className="mt-0.5 text-xs font-semibold text-emerald-500 tnum">
        {moneyDisplay(Number(payload[0]?.value ?? 0), currency)}
      </p>
    </div>
  );
}

export function WeekdaySpendChart({
  data,
  currency,
}: {
  data: Array<{ day: string; value: number }>;
  currency: Currency;
}) {
  const { settings } = useApp();
  const palette = chartPalette(settings.theme === "dark");
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="28%">
          <defs>
            <linearGradient id="weekdayFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={palette.grid} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: palette.tick, fontSize: 10 }} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: palette.tick, fontSize: 10 }}
            tickFormatter={(value: number) => moneyDisplay(value, currency, true)}
          />
          <Tooltip content={<SimpleBarTooltip currency={currency} />} cursor={{ fill: palette.cursor }} />
          <Bar dataKey="value" radius={[5, 5, 2, 2]} maxBarSize={30}>
            {data.map((entry) => (
              <Cell key={entry.day} fill="url(#weekdayFill)" opacity={entry.value === max ? 1 : 0.72} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetGauge({ pct, tone }: { pct: number; tone: "safe" | "warn" | "danger" }) {
  const color = tone === "danger" ? "#f43f5e" : tone === "warn" ? "#f59e0b" : "#10b981";
  const { settings } = useApp();
  const track = settings.theme === "dark" ? "#1b2639" : "#e9edf4";
  const value = Math.max(0, Math.min(100, pct));
  const data = [{ name: "used", value, fill: color }];

  return (
    <div className="relative h-[164px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          startAngle={210}
          endAngle={-30}
          innerRadius="72%"
          outerRadius="100%"
          barSize={13}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            background={{ fill: track }}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="font-display text-[27px] font-semibold leading-none tracking-tight text-ink tnum">{pct}%</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">budget used</span>
      </div>
    </div>
  );
}
