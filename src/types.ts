export type TxType = "income" | "expense";

export type Category =
  | "Food"
  | "Transport"
  | "Subscriptions"
  | "Shopping"
  | "Bills"
  | "Salary"
  | "Freelance";

export type PaymentMethod = "UPI" | "Credit Card" | "Cash" | "Bank Transfer";

export type Currency = "INR" | "USD";

export type Theme = "dark" | "light";

export type DateRange = "week" | "month" | "all";

export interface Transaction {
  id: string;
  title: string;
  /** Always stored in INR base currency */
  amount: number;
  type: TxType;
  category: Category;
  /** ISO yyyy-mm-dd */
  date: string;
  method: PaymentMethod;
  notes?: string;
  createdAt: number;
}

export interface Budgets {
  overall: number;
  categories: Record<Category, number>;
}

export interface Settings {
  currency: Currency;
  theme: Theme;
  name: string;
  email: string;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  budgets: Budgets;
  settings: Settings;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: "success" | "info" | "warning" | "danger";
}

export type ViewKey = "dashboard" | "transactions" | "budgets" | "analytics" | "settings";

export interface Filters {
  range: DateRange;
  category: Category | "All";
  type: TxType | "All";
  query: string;
}
