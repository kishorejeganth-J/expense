import type { ReactNode } from "react";
import { Pencil, Receipt, Trash2 } from "lucide-react";
import type { Transaction } from "@/types";
import { useApp } from "@/lib/store";
import { CATEGORY_META, PAYMENT_META } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import { cn } from "@/utils/cn";

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  compact = false,
  emptyAction,
  emptyQuery = false,
}: {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  compact?: boolean;
  emptyAction?: ReactNode;
  emptyQuery?: boolean;
}) {
  const { settings } = useApp();
  const currency = settings.currency;

  if (!transactions.length) {
    return (
      <EmptyState
        icon={<Receipt className="h-5 w-5" />}
        title={emptyQuery ? "No matching transactions" : "No transactions yet"}
        description={
          emptyQuery
            ? "Try a different search term or reset your filters to see more activity."
            : "Your activity will appear here. Log your first income or expense to get started."
        }
        action={emptyAction}
      />
    );
  }

  return (
    <div>
      {!compact ? (
        <div className="hidden items-center gap-3 border-b border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint md:flex">
          <span className="w-9 shrink-0" aria-hidden="true" />
          <span className="flex-1">Transaction</span>
          <span className="w-28">Category</span>
          <span className="w-24">Date</span>
          <span className="w-28">Method</span>
          <span className="w-24 text-right">Amount</span>
          <span className="w-[68px]" />
        </div>
      ) : null}

      <div className="divide-y divide-line/60">
        {transactions.map((tx) => {
          const meta = CATEGORY_META[tx.category];
          const Icon = meta.icon;
          const methodMeta = PAYMENT_META[tx.method];
          const MethodIcon = methodMeta.icon;
          const income = tx.type === "income";

          return (
            <div
              key={tx.id}
              role="button"
              tabIndex={0}
              onClick={() => onEdit(tx)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onEdit(tx);
                }
              }}
              className="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/60 focus-visible:bg-surface-2/60"
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                  meta.soft
                )}
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[13px] font-medium text-ink">{tx.title}</p>
                  {income ? (
                    <span className="hidden shrink-0 rounded bg-emerald-500/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 sm:inline">
                      Income
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-faint">
                  <span>{meta.label}</span>
                  <span className="text-line-strong">·</span>
                  <MethodIcon className="h-3 w-3" />
                  <span>{tx.method}</span>
                  {compact ? (
                    <>
                      <span className="text-line-strong">·</span>
                      <span className="shrink-0 text-faint">{formatDate(tx.date)}</span>
                    </>
                  ) : null}
                  <span className="hidden truncate text-faint sm:inline">
                    {tx.notes ? ` · ${tx.notes}` : ""}
                  </span>
                </p>
              </div>

              {!compact ? (
                <div className="hidden w-28 md:block">
                  <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted ring-1 ring-inset ring-line">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
                    <span className="truncate">{tx.category}</span>
                  </span>
                </div>
              ) : null}

              {!compact ? (
                <span className="hidden w-24 text-[11px] font-medium text-muted tnum md:block">
                  {formatDate(tx.date)}
                </span>
              ) : null}

              {!compact ? (
                <span className="hidden w-28 items-center gap-1.5 text-[11px] text-muted md:flex">
                  <MethodIcon className="h-3.5 w-3.5 text-faint" />
                  <span className="truncate">{tx.method}</span>
                </span>
              ) : null}

              <div className="ml-auto flex shrink-0 flex-col items-end sm:ml-0 sm:w-24">
                <span
                  className={cn(
                    "text-[13px] font-semibold tnum",
                    income ? "text-emerald-600 dark:text-emerald-400" : "text-ink"
                  )}
                >
                  {income ? "+" : "−"}
                  {formatMoney(tx.amount, currency)}
                </span>
                <span className="mt-0.5 text-[10px] text-faint md:hidden">
                  {!compact ? `${formatDate(tx.date)} · ${tx.method}` : meta.label}
                </span>
              </div>

              <div className="hidden w-[68px] shrink-0 items-center justify-end gap-1 sm:flex">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(tx);
                  }}
                  aria-label={`Edit ${tx.title}`}
                  title="Edit"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-faint opacity-0 transition-all hover:bg-surface-3 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 md:opacity-100 md:text-muted lg:opacity-0 lg:group-hover:opacity-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(tx);
                  }}
                  aria-label={`Delete ${tx.title}`}
                  title="Delete"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-faint opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-500 focus-visible:opacity-100 group-hover:opacity-100 md:opacity-100 md:text-muted lg:opacity-0 lg:group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
