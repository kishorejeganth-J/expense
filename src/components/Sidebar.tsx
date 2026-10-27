import { ArrowLeftRight, ChevronLeft, ChevronRight, LayoutDashboard, PieChart, Settings2, Wallet } from "lucide-react";
import type { ViewKey } from "@/types";
import { useApp } from "@/lib/store";
import { getKpis } from "@/lib/analytics";
import { formatCompact } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { Progress } from "@/components/ui";
import { cn } from "@/utils/cn";

const NAV_ITEMS: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard },
  { key: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { key: "budgets", label: "Budgets", icon: Wallet },
  { key: "analytics", label: "Insights", icon: PieChart },
];

export function Sidebar({
  view,
  onNavigate,
  collapsed,
  onToggle,
  alertCount,
}: {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  collapsed: boolean;
  onToggle: () => void;
  alertCount: number;
}) {
  const { transactions, budgets, settings } = useApp();
  const kpis = getKpis(transactions, budgets);
  const usage = Math.min(100, kpis.budgetUsedPct);
  const initials = settings.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-line bg-surface/85 backdrop-blur-2xl transition-[width] duration-300 lg:flex",
        collapsed ? "w-[84px]" : "w-[260px]"
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-line/70", collapsed ? "justify-center px-3" : "px-5")}>
        <button onClick={() => onNavigate("dashboard")} className="text-left" aria-label="Go to overview">
          <Logo compact={collapsed} />
        </button>
      </div>

      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[74px] flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-sm transition-colors hover:text-ink"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar px-3 py-5">
        {!collapsed ? (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Workspace</p>
        ) : null}

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = view === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center px-2" : "px-3",
                  active
                    ? "bg-emerald-500/[0.09] text-ink ring-1 ring-inset ring-emerald-500/15"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400" />
                ) : null}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active ? "text-emerald-500" : "text-faint group-hover:text-muted"
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
                {!collapsed && item.key === "transactions" ? (
                  <span className="ml-auto rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold tnum text-muted">
                    {transactions.length}
                  </span>
                ) : null}
                {!collapsed && item.key === "budgets" && alertCount > 0 ? (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
                ) : null}
                {collapsed && item.key === "budgets" && alertCount > 0 ? (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
                ) : null}
              </button>
            );
          })}
        </nav>

        {!collapsed ? (
          <div className="mt-4 rounded-2xl border border-line bg-gradient-to-b from-surface-2 to-surface p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted">Monthly budget</p>
              <span
                className={cn(
                  "text-[11px] font-semibold tnum",
                  usage >= 90 ? "text-rose-500" : usage >= 75 ? "text-amber-500" : "text-emerald-500"
                )}
              >
                {kpis.budgetUsedPct}%
              </span>
            </div>
            <Progress
              value={usage}
              tone={usage >= 90 ? "rose" : usage >= 75 ? "amber" : "emerald"}
              className="mt-2"
            />
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              <span className="font-semibold text-ink">{formatCompact(Math.max(0, kpis.remaining), settings.currency)}</span>{" "}
              left of {formatCompact(budgets.overall, settings.currency)}
            </p>
            <button
              onClick={() => onNavigate("budgets")}
              className="mt-2.5 text-[11px] font-semibold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
            >
              Manage budgets →
            </button>
          </div>
        ) : (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => onNavigate("budgets")}
              aria-label="View budgets"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-muted hover:text-ink"
            >
              <Wallet className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 rounded bg-surface px-0.5 text-[9px] font-bold text-emerald-500">
                {kpis.budgetUsedPct}%
              </span>
            </button>
          </div>
        )}

        <div className="mt-auto pt-6">
          {!collapsed ? (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Account</p>
          ) : null}
          <button
            onClick={() => onNavigate("settings")}
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors",
              collapsed ? "justify-center px-2" : "px-3",
              view === "settings" ? "bg-emerald-500/[0.09] text-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
            )}
          >
            <Settings2 className={cn("h-[18px] w-[18px] shrink-0", view === "settings" ? "text-emerald-500" : "text-faint")} />
            {!collapsed ? "Settings" : null}
          </button>
        </div>
      </div>

      <div className={cn("border-t border-line/70 p-3", collapsed && "flex justify-center")}>
        <button
          onClick={() => onNavigate("settings")}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-surface-2",
            collapsed && "w-auto"
          )}
          title={collapsed ? settings.name : undefined}
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
            {initials || "FM"}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-emerald-400" />
          </span>
          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-ink">{settings.name}</span>
              <span className="block truncate text-[10px] text-faint">Personal workspace</span>
            </span>
          ) : null}
        </button>
      </div>
    </aside>
  );
}
