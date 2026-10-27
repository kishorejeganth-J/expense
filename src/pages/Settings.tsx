import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Database,
  Download,
  FileText,
  HardDrive,
  Moon,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  UserRound,
  Wallet,
} from "lucide-react";
import type { Currency, Theme, ViewKey } from "@/types";
import { useApp } from "@/lib/store";
import { STORAGE_KEY } from "@/lib/constants";
import { USD_RATE, formatMoney, isInCurrentMonth } from "@/lib/format";
import { exportBackupJSON, exportTransactionsCSV, readBackupFile } from "@/lib/transfer";
import { Badge, Button, Card, CardHeading, Field, Input, PageHeading } from "@/components/ui";
import { cn } from "@/utils/cn";

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "FM"
  );
}

export function Settings({ onNavigate }: { onNavigate: (view: ViewKey) => void }) {
  const { settings, updateSettings, transactions, budgets, restoreBackup, resetAll, pushToast } = useApp();
  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [emailError, setEmailError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const restoreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(settings.name);
    setEmail(settings.email);
  }, [settings.name, settings.email]);

  const trimmedName = name.trim();
  const profileDirty = trimmedName !== settings.name || email.trim() !== settings.email;
  const currency = settings.currency;

  const saveProfile = () => {
    if (!trimmedName) {
      pushToast({ tone: "danger", title: "Name can't be empty", description: "Add a name to personalise your dashboard." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    updateSettings({ name: trimmedName, email: email.trim() });
    pushToast({ tone: "success", title: "Profile updated", description: "Your details are saved on this device." });
  };

  const changeCurrency = (next: Currency) => {
    if (next === currency) return;
    updateSettings({ currency: next });
    pushToast({
      tone: "info",
      title: `Display currency: ${next}`,
      description:
        next === "USD"
          ? `Amounts convert at ₹${USD_RATE.toFixed(2)} per $1. Your data stays stored in INR.`
          : "Showing all amounts in Indian Rupees.",
    });
  };

  const changeTheme = (next: Theme) => {
    if (next === settings.theme) return;
    updateSettings({ theme: next });
  };

  const backup = () => {
    exportBackupJSON(transactions, budgets, settings);
    pushToast({
      tone: "success",
      title: "Backup downloaded",
      description: `${transactions.length} transactions, budgets and preferences included.`,
    });
  };

  const exportCsv = () => {
    if (!transactions.length) {
      pushToast({ tone: "warning", title: "Nothing to export", description: "Your ledger is empty." });
      return;
    }
    exportTransactionsCSV(transactions, currency);
    pushToast({ tone: "success", title: "CSV exported", description: `All ${transactions.length} transactions are in your downloads.` });
  };

  const restore = async (file: File | null) => {
    if (!file) return;
    const data = await readBackupFile(file);
    if (!data) {
      pushToast({ tone: "danger", title: "Invalid backup", description: "Choose a JSON file exported from Finora." });
      return;
    }
    restoreBackup(data);
    pushToast({
      tone: "success",
      title: "Backup restored",
      description: `${data.transactions.length} transactions loaded successfully.`,
    });
  };

  const resetWorkspace = () => {
    resetAll();
    setConfirmReset(false);
    pushToast({
      tone: "warning",
      title: "Workspace reset",
      description: "Sample transactions and default budgets have been restored.",
    });
  };

  const monthlyTotal = transactions.filter((tx) => isInCurrentMonth(tx.date)).length;
  const expenses = transactions.filter((tx) => tx.type === "expense").reduce((acc, tx) => acc + tx.amount, 0);
  const allocatedCategories = Object.values(budgets.categories).filter((value) => value > 0).length;
  const storageKb = Math.max(
    1,
    Math.round(JSON.stringify({ transactions, budgets, settings }).length / 1024)
  );
  const memberSince = transactions.length
    ? new Date(Math.min(...transactions.map((tx) => tx.createdAt))).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      })
    : "Just now";

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Account"
        title="Settings"
        description="Personalise your workspace, switch display preferences, and keep your data portable."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="p-4 sm:p-5">
            <CardHeading title="Profile" subtitle="Shown across your dashboard and greetings" action={<UserRound className="h-4 w-4 text-faint" />} />
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-lg font-bold text-white shadow-[0_12px_30px_-14px_rgba(99,102,241,0.9)]">
                  {initialsOf(name)}
                </div>
                <div className="sm:mt-1">
                  <p className="text-xs font-semibold text-ink">{trimmedName || "Your name"}</p>
                  <p className="mt-0.5 text-[10px] text-faint">Local-first account</p>
                </div>
              </div>
              <div className="grid flex-1 gap-3">
                <Field label="Full name" htmlFor="profile-name">
                  <Input
                    id="profile-name"
                    value={name}
                    maxLength={48}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Email" htmlFor="profile-email" error={emailError}>
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    maxLength={80}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (emailError) setEmailError("");
                    }}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(emailError)}
                    className={emailError ? "border-rose-500/60" : ""}
                  />
                </Field>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
              <p className="text-[10px] text-faint">Your profile never leaves this browser.</p>
              <Button variant="primary" size="sm" onClick={saveProfile} disabled={!profileDirty}>
                <Save className="h-3.5 w-3.5" />
                Save profile
              </Button>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeading title="Preferences" subtitle="Appearance and number formatting" action={<Palette className="h-4 w-4 text-faint" />} />

            <div className="mt-4">
              <p className="text-xs font-medium text-muted">Theme</p>
              <div className="mt-2 grid grid-cols-2 gap-2.5 sm:max-w-md">
                {(
                  [
                    { value: "dark" as const, label: "Dark", icon: Moon, canvas: "bg-[#05070e]", panel: "bg-[#0e1626]", line: "bg-[#1d2940]" },
                    { value: "light" as const, label: "Light", icon: Sun, canvas: "bg-[#f3f5fa]", panel: "bg-white", line: "bg-[#e5e9f1]" },
                  ] as const
                ).map((option) => {
                  const Icon = option.icon;
                  const active = settings.theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => changeTheme(option.value)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border p-2 text-left transition-all",
                        active ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-line hover:border-line-strong"
                      )}
                    >
                      <div className={cn("relative overflow-hidden rounded-lg border border-line/50 p-2", option.canvas)}>
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span className={cn("h-1 w-8 rounded-full", option.line)} />
                        </div>
                        <div className="mt-1.5 grid grid-cols-3 gap-1">
                          <div className={cn("col-span-3 rounded p-1.5", option.panel)}>
                            <div className={cn("h-1 w-8 rounded-full", option.line)} />
                            <div className="mt-1 h-1.5 w-12 rounded-full bg-emerald-500/70" />
                          </div>
                          <div className={cn("col-span-3 grid grid-cols-2 gap-1")}>
                            <div className={cn("h-5 rounded", option.panel)} />
                            <div className={cn("h-5 rounded", option.panel)} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                          <Icon className="h-3 w-3 text-faint" />
                          {option.label}
                        </span>
                        {active ? (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-emerald-950">
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 border-t border-line/70 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted">Display currency</p>
                <Badge tone="slate">Stored in INR</Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2.5 sm:max-w-md">
                {(
                  [
                    { value: "INR" as const, symbol: "₹", label: "Indian Rupee", hint: "en-IN formatting" },
                    { value: "USD" as const, symbol: "$", label: "US Dollar", hint: `1 USD = ₹${USD_RATE.toFixed(2)}` },
                  ] as const
                ).map((option) => {
                  const active = currency === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => changeCurrency(option.value)}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                        active ? "border-emerald-500/50 bg-emerald-500/[0.05]" : "border-line hover:border-line-strong"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
                          active ? "bg-emerald-500/15 text-emerald-500" : "bg-surface-2 text-muted"
                        )}
                      >
                        {option.symbol}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-ink">{option.label}</span>
                        <span className="block truncate text-[10px] text-faint">{option.hint}</span>
                      </span>
                      {active ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-faint">
                Sample data is stored in INR. Switching to USD converts every amount for display only — no rounding is
                applied to your underlying records.
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeading
              title="Data & backup"
              subtitle="Your ledger, budgets and preferences in one portable file"
              action={<Database className="h-4 w-4 text-faint" />}
            />
            <input
              ref={restoreRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                void restore(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            <div className="mt-3 divide-y divide-line/60">
              {[
                {
                  icon: Download,
                  title: "JSON backup",
                  description: "Download every transaction, budget and preference.",
                  action: (
                    <Button variant="secondary" size="sm" onClick={backup}>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  ),
                },
                {
                  icon: FileText,
                  title: "CSV export",
                  description: "A spreadsheet-ready ledger of all transactions.",
                  action: (
                    <Button variant="secondary" size="sm" onClick={exportCsv}>
                      <FileText className="h-3.5 w-3.5" />
                      Export
                    </Button>
                  ),
                },
                {
                  icon: Upload,
                  title: "Restore from backup",
                  description: "Replace your workspace with a JSON backup file.",
                  action: (
                    <Button variant="secondary" size="sm" onClick={() => restoreRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" />
                      Restore
                    </Button>
                  ),
                },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.title} className="flex flex-wrap items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted ring-1 ring-inset ring-line">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-ink">{row.title}</p>
                      <p className="mt-0.5 text-[10px] text-faint">{row.description}</p>
                    </div>
                    {row.action}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 ring-1 ring-inset ring-rose-500/20">
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-ink">Reset workspace</p>
                    <p className="text-[10px] text-faint">Restore the demo data and default budgets.</p>
                  </div>
                </div>
                {confirmReset ? (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={resetWorkspace}>
                      Yes, reset
                    </Button>
                  </div>
                ) : (
                  <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="relative overflow-hidden p-4 sm:p-5">
            <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-indigo-500/15 blur-3xl" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-sm font-bold text-white">
                {initialsOf(settings.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-ink">{settings.name}</p>
                <p className="truncate text-[11px] text-faint">{settings.email}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: "Transactions", value: transactions.length },
                { label: "Tracked months", value: new Set(transactions.map((tx) => tx.date.slice(0, 7))).size },
                { label: "This month", value: monthlyTotal },
                { label: "Budgeted", value: `${allocatedCategories} cats` },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-line bg-surface-2/50 p-2.5">
                  <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-faint">{stat.label}</p>
                  <p className="mt-1 font-display text-sm font-semibold text-ink tnum">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-line/70 pt-3 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-faint">Member since</span>
                <span className="font-medium text-muted">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-faint">Total expenses</span>
                <span className="font-semibold text-ink tnum">{formatMoney(expenses, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-faint">Monthly limit</span>
                <span className="font-semibold text-ink tnum">{formatMoney(budgets.overall, currency)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeading title="Storage" subtitle="Local-first by design" action={<HardDrive className="h-4 w-4 text-faint" />} />
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-ink">Private on this device</p>
                <p className="mt-0.5 text-[10px] text-faint">No servers. No tracking. Just your browser.</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-faint">Storage used</span>
                <span className="font-medium text-muted tnum">~{storageKb} KB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-faint">Key</span>
                <span className="max-w-[160px] truncate font-mono text-[9px] text-faint">{STORAGE_KEY}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-faint">Auto-save</span>
                <Badge tone="emerald">
                  <Check className="h-2.5 w-2.5" />
                  Active
                </Badge>
              </div>
            </div>
            <p className="mt-3 border-t border-line/70 pt-2.5 text-[10px] leading-relaxed text-faint">
              Clearing browser data removes your ledger. Download a backup before clearing site storage.
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeading title="Quick actions" subtitle="Jump back into your money" action={<Sparkles className="h-4 w-4 text-faint" />} />
            <div className="mt-2 space-y-1">
              {[
                { label: "Manage budget limits", icon: Wallet, view: "budgets" as ViewKey },
                { label: "Explore financial insights", icon: Sparkles, view: "analytics" as ViewKey },
                { label: "Review all transactions", icon: FileText, view: "transactions" as ViewKey },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.label}
                    onClick={() => onNavigate(link.view)}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-2 text-left text-[11px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    <Icon className="h-3.5 w-3.5 text-faint" />
                    <span className="flex-1">{link.label}</span>
                    <ArrowRight className="h-3 w-3 text-faint" />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
