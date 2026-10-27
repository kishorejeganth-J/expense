import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import type { Category, Currency, PaymentMethod, Transaction, TxType } from "@/types";
import { useApp } from "@/lib/store";
import { CATEGORY_META, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_META, PAYMENT_METHODS } from "@/lib/constants";
import { USD_RATE, formatMoney, isInCurrentMonth, toBase, todayISO, toDisplay, uid } from "@/lib/format";
import { Button, Field, Input, Modal, Progress, Textarea } from "@/components/ui";
import { cn } from "@/utils/cn";

interface FormErrors {
  title?: string;
  amount?: string;
  date?: string;
}

export function TransactionModal({
  open,
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  initial: Transaction | null;
  onClose: () => void;
  onSubmit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const { settings, budgets, transactions } = useApp();
  const isEdit = Boolean(initial);
  const [type, setType] = useState<TxType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [entryCurrency, setEntryCurrency] = useState<Currency>(settings.currency);
  const [category, setCategory] = useState<Category>("Food");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? "expense");
    setTitle(initial?.title ?? "");
    setAmount(initial ? toDisplay(initial.amount, settings.currency).toFixed(2) : "");
    setEntryCurrency(settings.currency);
    setCategory(initial?.category ?? "Food");
    setDate(initial?.date ?? todayISO());
    setMethod(initial?.method ?? "UPI");
    setNotes(initial?.notes ?? "");
    setErrors({});
    setConfirmDelete(false);
  }, [open, initial, settings.currency]);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const parsedAmount = Number(amount.replace(/,/g, ""));
  const baseAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? toBase(parsedAmount, entryCurrency) : 0;

  const handleType = (next: TxType) => {
    setType(next);
    const valid = next === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!valid.includes(category)) {
      setCategory(valid[0]);
    }
  };

  const budgetImpact = useMemo(() => {
    if (type !== "expense") return null;
    const limit = budgets.categories[category] ?? 0;
    if (limit <= 0) return null;
    const spent = transactions
      .filter((tx) => tx.type === "expense" && tx.category === category && isInCurrentMonth(tx.date) && tx.id !== initial?.id)
      .reduce((acc, tx) => acc + tx.amount, 0);
    const next = spent + baseAmount;
    return { limit, spent, next, pct: Math.round((next / limit) * 100) };
  }, [type, budgets, category, transactions, baseAmount, initial?.id]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!title.trim()) nextErrors.title = "Give this transaction a title";
    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = "Enter an amount greater than zero";
    } else if (parsedAmount > 10_000_000) {
      nextErrors.amount = "That amount looks a little too large";
    }
    if (!date) nextErrors.date = "Pick a date";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload: Transaction = {
      id: initial?.id ?? uid(),
      createdAt: initial?.createdAt ?? Date.now(),
      title: title.trim(),
      amount: Math.round(baseAmount * 100) / 100,
      type,
      category,
      date,
      method,
      notes: notes.trim(),
    };
    onSubmit(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit transaction" : "Add transaction"}
      description={isEdit ? "Update the details of this entry." : "Log an income or expense in a few seconds."}
      width="max-w-xl"
      icon={type === "income" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      footer={
        confirmDelete && initial ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Delete <span className="font-semibold text-ink">{initial.title}</span>? This can&apos;t be undone.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)} type="button">
                Keep it
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => {
                  onDelete(initial.id);
                  onClose();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            {isEdit && initial ? (
              <Button variant="ghost" size="sm" type="button" onClick={() => setConfirmDelete(true)} className="text-rose-500 hover:text-rose-500">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            ) : (
              <span className="hidden text-[11px] text-faint sm:block">All amounts are stored securely on your device.</span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" form="transaction-form">
                <Check className="h-4 w-4" strokeWidth={2.6} />
                {isEdit ? "Save changes" : "Add transaction"}
              </Button>
            </div>
          </div>
        )
      }
    >
      <form id="transaction-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-2.5">
          {(
            [
              { value: "expense" as const, label: "Expense", icon: TrendingDown, hint: "Money going out" },
              { value: "income" as const, label: "Income", icon: TrendingUp, hint: "Money coming in" },
            ] as const
          ).map((option) => {
            const Icon = option.icon;
            const active = type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleType(option.value)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                  active
                    ? option.value === "income"
                      ? "border-emerald-500/40 bg-emerald-500/[0.08]"
                      : "border-indigo-500/40 bg-indigo-500/[0.08]"
                    : "border-line bg-surface-2/40 hover:border-line-strong"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    active
                      ? option.value === "income"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-indigo-500/15 text-indigo-400"
                      : "bg-surface-3 text-faint"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-ink">{option.label}</span>
                  <span className="block truncate text-[10px] text-faint">{option.hint}</span>
                </span>
                <span
                  className={cn(
                    "ml-auto flex h-4 w-4 items-center justify-center rounded-full border",
                    active ? "border-emerald-500 bg-emerald-500 text-emerald-950" : "border-line-strong"
                  )}
                >
                  {active ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                </span>
              </button>
            );
          })}
        </div>

        <Field label="Title" htmlFor="tx-title" error={errors.title}>
          <Input
            id="tx-title"
            autoFocus
            value={title}
            maxLength={60}
            onChange={(event) => {
              setTitle(event.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder={type === "expense" ? "e.g. Dinner at Toit" : "e.g. Monthly salary"}
            aria-invalid={Boolean(errors.title)}
            className={errors.title ? "border-rose-500/60" : ""}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Amount"
            htmlFor="tx-amount"
            error={errors.amount}
            hint={
              <span className="flex items-center gap-0.5 rounded-md border border-line bg-surface-2 p-0.5">
                {(["INR", "USD"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      if (code === entryCurrency) return;
                      const numeric = Number(amount.replace(/,/g, ""));
                      if (Number.isFinite(numeric) && numeric > 0) {
                        const converted = code === "USD" ? numeric / USD_RATE : numeric * USD_RATE;
                        setAmount(converted.toFixed(2));
                      }
                      setEntryCurrency(code);
                    }}
                    aria-pressed={entryCurrency === code}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
                      entryCurrency === code ? "bg-surface text-ink shadow-sm" : "text-faint hover:text-ink"
                    )}
                  >
                    {code === "INR" ? "₹ INR" : "$ USD"}
                  </button>
                ))}
              </span>
            }
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
                {entryCurrency === "INR" ? "₹" : "$"}
              </span>
              <Input
                id="tx-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  const next = event.target.value.replace(/[^\d.,]/g, "");
                  setAmount(next);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                placeholder="0.00"
                aria-invalid={Boolean(errors.amount)}
                className={cn("pl-7 text-base font-semibold tnum", errors.amount ? "border-rose-500/60" : "")}
              />
            </div>
            {entryCurrency === "USD" ? (
              <p className="mt-1 text-[10px] text-faint">Converted at ₹{USD_RATE.toFixed(2)} per $1 and stored in INR.</p>
            ) : null}
          </Field>

          <Field label="Date" htmlFor="tx-date" error={errors.date}>
            <Input
              id="tx-date"
              type="date"
              value={date}
              max="2999-12-31"
              onChange={(event) => {
                setDate(event.target.value);
                if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              aria-invalid={Boolean(errors.date)}
              className={errors.date ? "border-rose-500/60" : ""}
            />
          </Field>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted">Category</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((option) => {
              const meta = CATEGORY_META[option];
              const Icon = meta.icon;
              const active = category === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition-all",
                    active
                      ? "border-emerald-500/40 bg-emerald-500/[0.07] text-ink"
                      : "border-line bg-surface-2/40 text-muted hover:border-line-strong hover:text-ink"
                  )}
                >
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-md ring-1 ring-inset", meta.soft)}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="truncate">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted">Payment method</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PAYMENT_METHODS.map((option) => {
              const Icon = PAYMENT_META[option].icon;
              const active = method === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMethod(option)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition-all",
                    active
                      ? "border-emerald-500/40 bg-emerald-500/[0.07] text-ink"
                      : "border-line bg-surface-2/40 text-muted hover:border-line-strong hover:text-ink"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", active ? "text-emerald-500" : "text-faint")} />
                  <span className="truncate">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Notes" htmlFor="tx-notes" hint={<span className="text-faint">Optional</span>}>
          <Textarea
            id="tx-notes"
            value={notes}
            maxLength={240}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add a context note, invoice number, or reminder…"
          />
        </Field>

        {budgetImpact ? (
          <div className="rounded-xl border border-line bg-surface-2/50 p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-medium text-muted">
                {budgetImpact.pct >= 90 ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
                {CATEGORY_META[category].label} budget impact
              </span>
              <span
                className={cn(
                  "font-semibold tnum",
                  budgetImpact.pct >= 90 ? "text-rose-500" : budgetImpact.pct >= 75 ? "text-amber-500" : "text-emerald-500"
                )}
              >
                {budgetImpact.pct}%
              </span>
            </div>
            <Progress
              value={budgetImpact.pct}
              tone={budgetImpact.pct >= 90 ? "rose" : budgetImpact.pct >= 75 ? "amber" : "emerald"}
              className="mt-2"
            />
            <p className="mt-1.5 text-[10px] text-faint tnum">
              {formatMoney(budgetImpact.next, settings.currency)} of {formatMoney(budgetImpact.limit, settings.currency)} after
              this entry
              {budgetImpact.next > budgetImpact.limit ? " · this puts you over budget" : ""}
            </p>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}


