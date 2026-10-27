import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Trash2 } from "lucide-react";
import type { Filters, Transaction, ViewKey } from "@/types";
import { AppProvider, useApp } from "@/lib/store";
import { getBudgetAlerts } from "@/lib/analytics";
import { CATEGORY_META, PAYMENT_META } from "@/lib/constants";
import { formatDate, formatMoney, isInCurrentMonth } from "@/lib/format";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { MobileNav } from "@/components/MobileNav";
import { Toaster } from "@/components/Toaster";
import { TransactionModal } from "@/components/TransactionModal";
import { Button, Modal } from "@/components/ui";
import { Dashboard } from "@/pages/Dashboard";
import { Transactions } from "@/pages/Transactions";
import { Budgets } from "@/pages/Budgets";
import { Analytics } from "@/pages/Analytics";
import { Settings } from "@/pages/Settings";
import { cn } from "@/utils/cn";

const DEFAULT_FILTERS: Filters = { range: "month", category: "All", type: "All", query: "" };
const COLLAPSE_KEY = "finora.sidebar.collapsed";
const VIEWS: ViewKey[] = ["dashboard", "transactions", "budgets", "analytics", "settings"];

function viewFromHash(): ViewKey {
  const hash = window.location.hash.replace("#", "") as ViewKey;
  return VIEWS.includes(hash) ? hash : "dashboard";
}

function AppShell() {
  const {
    transactions,
    budgets,
    settings,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    pushToast,
  } = useApp();

  const [view, setView] = useState<ViewKey>(() => viewFromHash());
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [collapsed, setCollapsed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      setCollapsed(false);
    }
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      } catch {
        /* ignore storage failures */
      }
      return !prev;
    });
  };

  const alerts = useMemo(() => getBudgetAlerts(transactions, budgets), [transactions, budgets]);
  const currency = settings.currency;

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (window.location.hash !== `#${view}`) {
      window.history.replaceState(null, "", `#${view}`);
    }
  }, [view]);

  const navigate = (next: ViewKey) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setFormOpen(true);
  };

  const handleQueryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, query: value }));
    if (value.trim()) setView("transactions");
  };

  const handleSubmit = (tx: Transaction, isEdit: boolean) => {
    const priorCategorySpend = transactions
      .filter(
        (item) =>
          item.type === "expense" &&
          item.category === tx.category &&
          isInCurrentMonth(item.date) &&
          item.id !== tx.id
      )
      .reduce((acc, item) => acc + item.amount, 0);

    if (isEdit) updateTransaction(tx);
    else addTransaction(tx);

    pushToast({
      tone: "success",
      title: isEdit ? "Transaction updated" : "Transaction added",
      description: `${formatMoney(tx.amount, currency)} · ${CATEGORY_META[tx.category].label} · ${formatDate(tx.date)}`,
    });

    if (tx.type === "expense") {
      const limit = budgets.categories[tx.category] ?? 0;
      if (limit > 0) {
        const percent = Math.round(((priorCategorySpend + tx.amount) / limit) * 100);
        if (percent >= 100) {
          pushToast({
            tone: "danger",
            title: `${tx.category} budget exceeded`,
            description: `You've now used ${percent}% of your ${formatMoney(limit, currency)} monthly limit.`,
          });
        } else if (percent >= 90) {
          pushToast({
            tone: "warning",
            title: `${tx.category} budget at ${percent}%`,
            description: `Only ${formatMoney(Math.max(0, limit - priorCategorySpend - tx.amount), currency)} left in this category.`,
          });
        }
      }
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteTransaction(deleteTarget.id);
    pushToast({
      tone: "success",
      title: "Transaction deleted",
      description: `${deleteTarget.title} · ${formatMoney(deleteTarget.amount, currency)} removed from your ledger.`,
    });
    setDeleteTarget(null);
  };

  const deleteIcon = deleteTarget ? CATEGORY_META[deleteTarget.category].icon : null;
  const DeleteCategoryIcon = deleteIcon;
  const MethodIcon = deleteTarget ? PAYMENT_META[deleteTarget.method].icon : null;

  return (
    <div className="min-h-dvh">
      <Sidebar
        view={view}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggle={toggleSidebar}
        alertCount={alerts.length}
      />

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding] duration-300",
          collapsed ? "lg:pl-[84px]" : "lg:pl-[260px]"
        )}
      >
        <Topbar
          view={view}
          onNavigate={navigate}
          onAdd={openAdd}
          query={filters.query}
          onQueryChange={handleQueryChange}
          alerts={alerts}
        />

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-3.5 pb-28 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pb-10">
          <div key={view} className="animate-rise">
            {view === "dashboard" ? (
              <Dashboard
                filters={filters}
                onFiltersChange={setFilters}
                onNavigate={navigate}
                onAdd={openAdd}
                onEdit={openEdit}
                onRequestDelete={setDeleteTarget}
              />
            ) : null}
            {view === "transactions" ? (
              <Transactions
                filters={filters}
                onFiltersChange={setFilters}
                onAdd={openAdd}
                onEdit={openEdit}
                onRequestDelete={setDeleteTarget}
              />
            ) : null}
            {view === "budgets" ? <Budgets onAdd={openAdd} /> : null}
            {view === "analytics" ? (
              <Analytics filters={filters} onFiltersChange={setFilters} onNavigate={navigate} />
            ) : null}
            {view === "settings" ? <Settings onNavigate={navigate} /> : null}
          </div>
        </main>

        <footer className="hidden items-center justify-between gap-3 border-t border-line/60 px-8 py-4 text-[10px] text-faint lg:flex">
          <p>
            Finora · Personal expense &amp; budget tracker ·{" "}
            <span className="text-muted">All data stays in this browser</span>
          </p>
          <p className="flex items-center gap-1.5">
            <BadgeCheck className="h-3 w-3 text-emerald-500" />
            Auto-saved locally · {transactions.length} entries
          </p>
        </footer>
      </div>

      <MobileNav view={view} onNavigate={navigate} onAdd={openAdd} />

      <TransactionModal
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(tx) => handleSubmit(tx, Boolean(editing))}
        onDelete={(id) => {
          const target = transactions.find((tx) => tx.id === id);
          if (!target) return;
          deleteTransaction(id);
          pushToast({
            tone: "success",
            title: "Transaction deleted",
            description: `${target.title} was removed from your ledger.`,
          });
        }}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete transaction?"
        description="This action can't be undone."
        width="max-w-md"
        icon={<Trash2 className="h-4 w-4" />}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" />
              Delete transaction
            </Button>
          </div>
        }
      >
        {deleteTarget ? (
          <div className="rounded-xl border border-line bg-surface-2/60 p-3.5">
            <div className="flex items-center gap-3">
              {DeleteCategoryIcon ? (
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset", CATEGORY_META[deleteTarget.category].soft)}>
                  <DeleteCategoryIcon className="h-4 w-4" />
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{deleteTarget.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                  {CATEGORY_META[deleteTarget.category].label}
                  <span className="text-line-strong">·</span>
                  {formatDate(deleteTarget.date, "long")}
                  {MethodIcon ? <MethodIcon className="h-3 w-3" /> : null}
                  {deleteTarget.method}
                </p>
              </div>
              <p
                className={cn(
                  "text-sm font-semibold tnum",
                  deleteTarget.type === "income" ? "text-emerald-500" : "text-ink"
                )}
              >
                {deleteTarget.type === "income" ? "+" : "−"}
                {formatMoney(deleteTarget.amount, currency)}
              </p>
            </div>
            {deleteTarget.notes ? (
              <p className="mt-3 border-t border-line/70 pt-2.5 text-[11px] text-muted">{deleteTarget.notes}</p>
            ) : null}
          </div>
        ) : null}
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          The entry will be removed immediately. Budget totals and charts will recalculate. Consider downloading a JSON
          backup first if you might need this record later.
        </p>
      </Modal>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
