import { ArrowLeftRight, LayoutDashboard, PieChart, Plus, Wallet } from "lucide-react";
import type { ViewKey } from "@/types";
import { cn } from "@/utils/cn";

const ITEMS: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Home", icon: LayoutDashboard },
  { key: "transactions", label: "Activity", icon: ArrowLeftRight },
  { key: "budgets", label: "Budgets", icon: Wallet },
  { key: "analytics", label: "Insights", icon: PieChart },
];

export function MobileNav({
  view,
  onNavigate,
  onAdd,
}: {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onAdd: () => void;
}) {
  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);

  const renderItem = (item: (typeof ITEMS)[number]) => {
    const active = view === item.key;
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        onClick={() => onNavigate(item.key)}
        aria-current={active ? "page" : undefined}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
      >
        <span
          className={cn(
            "flex h-8 w-12 items-center justify-center rounded-lg transition-colors",
            active ? "bg-emerald-500/12 text-emerald-500" : "text-faint"
          )}
        >
          <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.3 : 1.8} />
        </span>
        <span className={cn("text-[10px] font-medium", active ? "text-emerald-600 dark:text-emerald-400" : "text-faint")}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="relative mx-auto flex h-16 max-w-md items-center px-2">
        {left.map(renderItem)}
        <div className="flex w-16 shrink-0 items-start justify-center">
          <button
            onClick={onAdd}
            aria-label="Add transaction"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-canvas bg-emerald-500 text-emerald-950 shadow-[0_12px_30px_-10px_rgba(16,185,129,0.8)] transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.6} />
          </button>
        </div>
        {right.map(renderItem)}
      </div>
    </nav>
  );
}
