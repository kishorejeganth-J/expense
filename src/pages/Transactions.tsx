import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  Plus,
  RotateCcw,
  Search,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import type { Category, Filters, Transaction, TxType } from "@/types";
import { useApp } from "@/lib/store";
import { CATEGORIES, CATEGORY_META } from "@/lib/constants";
import { applyFilters, formatMoney, formatDate, sumAmount } from "@/lib/format";
import { exportBackupJSON, exportTransactionsCSV, readBackupFile } from "@/lib/transfer";
import { TransactionList } from "@/components/TransactionList";
import { Button, Card, PageHeading, Select, Segmented } from "@/components/ui";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 8;

export function Transactions({
  filters,
  onFiltersChange,
  onAdd,
  onEdit,
  onRequestDelete,
}: {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onAdd: () => void;
  onEdit: (tx: Transaction) => void;
  onRequestDelete: (tx: Transaction) => void;
}) {
  const { transactions, budgets, settings, restoreBackup, pushToast } = useApp();
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const currency = settings.currency;

  const filtered = useMemo(() => applyFilters(transactions, filters), [transactions, filters]);
  const income = sumAmount(filtered, "income");
  const expenses = sumAmount(filtered, "expense");
  const activeFilters =
    filters.query !== "" || filters.category !== "All" || filters.type !== "All" || filters.range !== "month";

  useEffect(() => {
    setPage(1);
  }, [filters.range, filters.category, filters.type, filters.query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () =>
    onFiltersChange({ range: "month", category: "All", type: "All", query: "" });

  const exportCsv = () => {
    if (!filtered.length) {
      pushToast({
        tone: "warning",
        title: "Nothing to export",
        description: "Adjust your filters so at least one transaction is visible.",
      });
      return;
    }
    exportTransactionsCSV(filtered, currency);
    pushToast({
      tone: "success",
      title: "CSV exported",
      description: `${filtered.length} filtered ${filtered.length === 1 ? "transaction" : "transactions"} saved to your downloads.`,
    });
  };

  const backupJson = () => {
    exportBackupJSON(transactions, budgets, settings);
    pushToast({
      tone: "success",
      title: "Backup created",
      description: `All ${transactions.length} transactions, budgets and preferences saved as JSON.`,
    });
  };

  const restore = async (file: File | null) => {
    if (!file) return;
    const data = await readBackupFile(file);
    if (!data) {
      pushToast({
        tone: "danger",
        title: "Restore failed",
        description: "That file isn't a valid Finora backup. Check the JSON file and try again.",
      });
      return;
    }
    restoreBackup(data);
    pushToast({
      tone: "success",
      title: "Backup restored",
      description: `${data.transactions.length} transactions and your budgets are back in place.`,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Ledger"
        title="Transactions"
        description="Every rupee, accounted for. Search, filter, edit and export your activity."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                void restore(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            <Button variant="secondary" size="sm" onClick={exportCsv} title="Export filtered transactions to CSV">
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={backupJson} title="Download a JSON backup">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Backup</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} title="Restore from JSON backup">
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Restore</span>
            </Button>
            <Button variant="primary" size="md" onClick={onAdd}>
              <Plus className="h-4 w-4" strokeWidth={2.6} />
              Add
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Income",
            value: income,
            icon: ArrowDownLeft,
            classes: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
          },
          {
            label: "Expenses",
            value: expenses,
            icon: ArrowUpRight,
            classes: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 ring-indigo-500/20",
          },
          {
            label: "Net balance",
            value: income - expenses,
            icon: Wallet,
            classes: "text-sky-600 dark:text-sky-400 bg-sky-500/10 ring-sky-500/20",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="flex items-center gap-3 p-3 sm:p-4">
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", item.classes)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-faint">{item.label}</p>
                <p className="mt-0.5 truncate font-display text-sm font-semibold text-ink tnum sm:text-base">
                  {formatMoney(item.value, currency)}
                </p>
              </div>
            </Card>
          );
        })}
        <Card className="flex items-center gap-3 p-3 sm:p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-500/10 text-muted ring-1 ring-inset ring-slate-500/20">
            <Search className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-faint">Results</p>
            <p className="mt-0.5 truncate font-display text-sm font-semibold text-ink tnum sm:text-base">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                value={filters.query}
                onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
                placeholder="Search by title, category, method or note…"
                aria-label="Search transactions"
                className="h-10 w-full rounded-xl border border-line bg-surface-2/70 pl-9 pr-9 text-sm text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-emerald-500/50 focus:bg-surface focus:outline-none"
              />
              {filters.query ? (
                <button
                  onClick={() => onFiltersChange({ ...filters, query: "" })}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <Segmented
              value={filters.range}
              onChange={(range) => onFiltersChange({ ...filters, range })}
              options={[
                { value: "week", label: "This week" },
                { value: "month", label: "This month" },
                { value: "all", label: "All time" },
              ]}
              ariaLabel="Date range"
              className="self-start sm:self-auto"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.category}
              onChange={(event) =>
                onFiltersChange({ ...filters, category: event.target.value as Category | "All" })
              }
              aria-label="Filter by category"
              className="h-9 w-auto min-w-[130px] flex-1 text-xs sm:flex-none"
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_META[category].label}
                </option>
              ))}
            </Select>
            <Select
              value={filters.type}
              onChange={(event) => onFiltersChange({ ...filters, type: event.target.value as TxType | "All" })}
              aria-label="Filter by type"
              className="h-9 w-auto min-w-[116px] flex-1 text-xs sm:flex-none"
            >
              <option value="All">All types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </Select>
            {activeFilters ? (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset filters
              </Button>
            ) : (
              <span className="ml-auto hidden items-center gap-1 text-[11px] text-faint sm:flex">
                Click any row to edit
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-ink">All transactions</h2>
            <p className="mt-0.5 text-[11px] text-faint">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              {filtered.length > 0 ? ` · ${formatDate(filtered[filtered.length - 1].date)} to ${formatDate(filtered[0].date)}` : ""}
            </p>
          </div>
          <span className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-[10px] font-medium text-muted tnum">
            {formatMoney(income - expenses, currency, { signed: true })} net
          </span>
        </div>

        <TransactionList
          transactions={paged}
          onEdit={onEdit}
          onDelete={onRequestDelete}
          emptyQuery={activeFilters}
          emptyAction={
            activeFilters ? (
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                <RotateCcw className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onAdd}>
                <Plus className="h-3.5 w-3.5" />
                Add transaction
              </Button>
            )
          }
        />

        {filtered.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
            <p className="text-[11px] text-faint tnum">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <span className="px-1 text-[11px] font-medium text-muted tnum">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
