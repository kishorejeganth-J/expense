import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { BackupData, Budgets, Settings, Toast, Transaction } from "@/types";
import {
  BACKUP_VERSION,
  CATEGORIES,
  DEFAULT_BUDGETS,
  DEFAULT_SETTINGS,
  SEED_TRANSACTIONS,
  STORAGE_KEY,
} from "@/lib/constants";
import { uid } from "@/lib/format";

interface PersistedState {
  transactions: Transaction[];
  budgets: Budgets;
  settings: Settings;
}

interface AppStore extends PersistedState {
  addTransaction: (input: Omit<Transaction, "createdAt">) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  saveBudgets: (budgets: Budgets) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  restoreBackup: (data: BackupData) => void;
  resetAll: () => void;
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppStore | null>(null);

function sanitizeBudgets(input: unknown): Budgets {
  const candidate = (input ?? {}) as Partial<Budgets>;
  const categories = { ...DEFAULT_BUDGETS.categories } as Record<string, number>;
  Object.entries((candidate.categories ?? {}) as Record<string, unknown>).forEach(([key, value]) => {
    if (CATEGORIES.includes(key as (typeof CATEGORIES)[number]) && typeof value === "number" && Number.isFinite(value)) {
      categories[key] = Math.max(0, Math.round(value));
    }
  });
  return {
    overall:
      typeof candidate.overall === "number" && Number.isFinite(candidate.overall)
        ? Math.max(0, Math.round(candidate.overall))
        : DEFAULT_BUDGETS.overall,
    categories: categories as Budgets["categories"],
  };
}

function sanitizeSettings(input: unknown): Settings {
  const candidate = (input ?? {}) as Partial<Settings>;
  return {
    currency: candidate.currency === "USD" ? "USD" : "INR",
    theme: candidate.theme === "light" ? "light" : "dark",
    name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name : DEFAULT_SETTINGS.name,
    email: typeof candidate.email === "string" ? candidate.email : DEFAULT_SETTINGS.email,
  };
}

export function sanitizeTransaction(input: unknown): Transaction | null {
  if (!input || typeof input !== "object") return null;
  const tx = input as Partial<Transaction>;
  if (!tx.title || typeof tx.title !== "string") return null;
  if (typeof tx.amount !== "number" || !Number.isFinite(tx.amount) || tx.amount <= 0) return null;
  if (!CATEGORIES.includes(tx.category as (typeof CATEGORIES)[number])) return null;
  if (tx.type !== "income" && tx.type !== "expense") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.date ?? "")) return null;
  return {
    id: typeof tx.id === "string" && tx.id ? tx.id : uid(),
    title: tx.title.slice(0, 80),
    amount: Math.round(tx.amount * 100) / 100,
    type: tx.type,
    category: tx.category as Transaction["category"],
    date: tx.date as string,
    method: (["UPI", "Credit Card", "Cash", "Bank Transfer"] as const).includes(
      tx.method as "UPI" | "Credit Card" | "Cash" | "Bank Transfer"
    )
      ? (tx.method as Transaction["method"])
      : "UPI",
    notes: typeof tx.notes === "string" ? tx.notes.slice(0, 300) : "",
    createdAt: typeof tx.createdAt === "number" ? tx.createdAt : Date.now(),
  };
}

export function parseBackup(raw: string): BackupData | null {
  try {
    const parsed = JSON.parse(raw) as Partial<BackupData>;
    if (!parsed || !Array.isArray(parsed.transactions)) return null;
    const transactions = parsed.transactions
      .map((tx) => sanitizeTransaction(tx))
      .filter((tx): tx is Transaction => Boolean(tx));
    return {
      version: typeof parsed.version === "number" ? parsed.version : BACKUP_VERSION,
      exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
      transactions,
      budgets: sanitizeBudgets(parsed.budgets),
      settings: sanitizeSettings(parsed.settings),
    };
  } catch {
    return null;
  }
}

function loadState(): PersistedState {
  if (typeof window === "undefined") {
    return { transactions: SEED_TRANSACTIONS, budgets: DEFAULT_BUDGETS, settings: DEFAULT_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { transactions: SEED_TRANSACTIONS, budgets: DEFAULT_BUDGETS, settings: DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const transactions = Array.isArray(parsed.transactions)
      ? parsed.transactions
          .map((tx) => sanitizeTransaction(tx))
          .filter((tx): tx is Transaction => Boolean(tx))
      : SEED_TRANSACTIONS;
    return {
      transactions: transactions.length ? transactions : SEED_TRANSACTIONS,
      budgets: sanitizeBudgets(parsed.budgets),
      settings: sanitizeSettings(parsed.settings),
    };
  } catch {
    return { transactions: SEED_TRANSACTIONS, budgets: DEFAULT_BUDGETS, settings: DEFAULT_SETTINGS };
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — app keeps working in memory */
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", state.settings.theme === "dark");
    root.style.colorScheme = state.settings.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", state.settings.theme === "dark" ? "#05070e" : "#f3f5fa");
  }, [state.settings.theme]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => window.clearTimeout(timer));
      map.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
        timers.current.delete(id);
      }, 4600);
      timers.current.set(id, timer);
    },
    []
  );

  const addTransaction = useCallback((input: Omit<Transaction, "createdAt">) => {
    const tx: Transaction = { ...input, createdAt: Date.now() };
    setState((prev) => ({ ...prev, transactions: [tx, ...prev.transactions] }));
  }, []);

  const updateTransaction = useCallback((tx: Transaction) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((item) => (item.id === tx.id ? tx : item)),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((prev) => ({ ...prev, transactions: prev.transactions.filter((item) => item.id !== id) }));
  }, []);

  const saveBudgets = useCallback((budgets: Budgets) => {
    setState((prev) => ({ ...prev, budgets: sanitizeBudgets(budgets) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: sanitizeSettings({ ...prev.settings, ...patch }) }));
  }, []);

  const restoreBackup = useCallback((data: BackupData) => {
    setState({
      transactions: data.transactions,
      budgets: sanitizeBudgets(data.budgets),
      settings: sanitizeSettings(data.settings),
    });
  }, []);

  const resetAll = useCallback(() => {
    setState({ transactions: SEED_TRANSACTIONS, budgets: DEFAULT_BUDGETS, settings: DEFAULT_SETTINGS });
  }, []);

  const value = useMemo<AppStore>(
    () => ({
      ...state,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      saveBudgets,
      updateSettings,
      restoreBackup,
      resetAll,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      state,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      saveBudgets,
      updateSettings,
      restoreBackup,
      resetAll,
      toasts,
      pushToast,
      dismissToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppStore {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
