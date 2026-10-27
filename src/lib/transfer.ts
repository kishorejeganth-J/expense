import type { BackupData, Budgets, Currency, Settings, Transaction } from "@/types";
import { BACKUP_VERSION, CATEGORY_META } from "@/lib/constants";
import { buildCSV, downloadBlob, formatDate } from "@/lib/format";
import { parseBackup } from "@/lib/store";

export function exportTransactionsCSV(transactions: Transaction[], currency: Currency) {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(buildCSV(transactions, currency), `finora-transactions-${stamp}.csv`, "text/csv;charset=utf-8;");
}

export function exportBackupJSON(transactions: Transaction[], budgets: Budgets, settings: Settings) {
  const payload: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    transactions,
    budgets,
    settings,
  };
  downloadBlob(JSON.stringify(payload, null, 2), `finora-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
}

export function readBackupFile(file: File): Promise<BackupData | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = parseBackup(String(reader.result ?? ""));
      resolve(data);
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

export function csvFilenamePreview(transactions: Transaction[]): string {
  if (!transactions.length) return "No transactions in current filter";
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  return `${formatDate(sorted[0].date)} – ${formatDate(sorted[sorted.length - 1].date)}`;
}

export function prettyCategory(category: keyof typeof CATEGORY_META): string {
  return CATEGORY_META[category].label;
}
