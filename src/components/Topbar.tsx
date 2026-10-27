import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, Moon, Plus, Search, ShieldCheck, Sun, Wallet, X } from "lucide-react";
import type { BudgetAlert } from "@/lib/analytics";
import type { ViewKey } from "@/types";
import { useApp } from "@/lib/store";
import { formatCompact, formatMoney } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { Badge, IconButton, Progress } from "@/components/ui";
import { cn } from "@/utils/cn";

const VIEW_LABEL: Record<ViewKey, string> = {
  dashboard: "Overview",
  transactions: "Transactions",
  budgets: "Budgets",
  analytics: "Insights",
  settings: "Settings",
};

export function Topbar({
  view,
  onNavigate,
  onAdd,
  query,
  onQueryChange,
  alerts,
}: {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onAdd: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  alerts: BudgetAlert[];
}) {
  const { settings, updateSettings } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(query);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(query);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const initials = settings.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isDark = settings.theme === "dark";

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <div className="lg:hidden">
          <Logo compact />
        </div>

        <div className="hidden min-w-0 items-center gap-2 text-xs text-faint lg:flex">
          <button onClick={() => onNavigate("dashboard")} className="transition-colors hover:text-ink">
            Finora
          </button>
          <span className="text-line-strong">/</span>
          <span className="font-medium text-ink">{VIEW_LABEL[view]}</span>
        </div>

        <div className="relative hidden w-full max-w-[260px] md:block xl:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              onQueryChange(event.target.value);
            }}
            onFocus={() => {
              if (view !== "transactions") onNavigate("transactions");
            }}
            placeholder="Search transactions"
            aria-label="Search transactions"
            className="h-9 w-full rounded-xl border border-line bg-surface-2/70 pl-9 pr-14 text-xs text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-emerald-500/50 focus:bg-surface focus:outline-none"
          />
          {search ? (
            <button
              onClick={() => {
                setSearch("");
                onQueryChange("");
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-faint xl:block">
              ⌘K
            </kbd>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div
            className="flex h-9 items-center rounded-xl border border-line bg-surface-2/70 p-0.5"
            role="group"
            aria-label="Display currency"
          >
            {(["INR", "USD"] as const).map((currency) => (
              <button
                key={currency}
                onClick={() => updateSettings({ currency })}
                aria-pressed={settings.currency === currency}
                title={currency === "INR" ? "Indian Rupee (₹)" : "US Dollar ($)"}
                className={cn(
                  "flex h-8 min-w-8 items-center justify-center gap-1 rounded-[9px] px-1.5 text-xs font-semibold transition-all",
                  settings.currency === currency
                    ? "bg-surface text-ink shadow-[0_1px_2px_rgba(2,6,23,0.12)] ring-1 ring-line"
                    : "text-faint hover:text-ink"
                )}
              >
                <span>{currency === "INR" ? "₹" : "$"}</span>
                <span className="hidden sm:inline">{currency}</span>
              </button>
            ))}
          </div>

          <IconButton
            label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => updateSettings({ theme: isDark ? "light" : "dark" })}
            className="bg-transparent"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </IconButton>

          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              aria-label={`Notifications${alerts.length ? `, ${alerts.length} budget alerts` : ""}`}
              aria-expanded={open}
              className={cn(
                "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-transparent text-muted transition-all hover:border-line-strong hover:bg-surface-2 hover:text-ink",
                open && "border-line-strong bg-surface-2 text-ink"
              )}
            >
              <Bell className="h-4 w-4" />
              {alerts.length > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                </span>
              ) : null}
            </button>

            {open ? (
              <div className="absolute right-0 top-11 w-[min(calc(100vw-2rem),350px)] animate-pop overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-slate-950/20">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">Budget alerts</p>
                    <p className="text-[11px] text-faint">Based on this month&apos;s spending</p>
                  </div>
                  {alerts.length > 0 ? <Badge tone="amber">{alerts.length} active</Badge> : null}
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="flex flex-col items-center px-6 py-8 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <p className="mt-2 text-xs font-semibold text-ink">Everything looks healthy</p>
                      <p className="mt-1 text-[11px] text-muted">All category budgets are under 75% used.</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <button
                        key={alert.id}
                        onClick={() => {
                          setOpen(false);
                          onNavigate("budgets");
                        }}
                        className="block w-full border-b border-line/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
                            {alert.tone === "danger" ? (
                              <ShieldCheck className="h-3.5 w-3.5 text-rose-500" />
                            ) : (
                              <Wallet className="h-3.5 w-3.5 text-amber-500" />
                            )}
                            {alert.label}
                          </span>
                          <span
                            className={cn(
                              "text-[11px] font-semibold tnum",
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
                          className="mt-2"
                        />
                        <p className="mt-1.5 text-[11px] text-faint tnum">
                          {formatMoney(alert.spent, settings.currency)} of {formatMoney(alert.limit, settings.currency)} ·{" "}
                          {alert.limit > alert.spent
                            ? `${formatCompact(alert.limit - alert.spent, settings.currency)} left`
                            : `${formatCompact(alert.spent - alert.limit, settings.currency)} over`}
                        </p>
                      </button>
                    ))
                  )}
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    onNavigate("budgets");
                  }}
                  className="block w-full border-t border-line bg-surface-2/50 px-4 py-2.5 text-center text-[11px] font-semibold text-emerald-600 transition-colors hover:bg-surface-2 dark:text-emerald-400"
                >
                  Review budgets
                </button>
              </div>
            ) : null}
          </div>

          <button
            onClick={onAdd}
            className="hidden h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-xs font-semibold text-emerald-950 shadow-[0_10px_24px_-12px_rgba(16,185,129,0.8)] transition-all hover:bg-emerald-400 active:scale-[0.98] sm:inline-flex"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            Add
          </button>

          <button
            onClick={() => onNavigate("settings")}
            aria-label="Open profile settings"
            className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white ring-2 ring-surface transition-transform hover:scale-105"
          >
            {initials || "FM"}
          </button>
        </div>
      </div>
    </header>
  );
}
