export type AccountClass = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export type Currency = 'USD' | 'BDT';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  provider: string;
  note: string;
  fileLink?: string;
  amount: number; // original amount
  currency: Currency;
  amountBDT: number; // calculated at the transaction month's exchange rate
  accountClass: AccountClass;
  isOperating: boolean;
}

export interface Income {
  id: string;
  date: string; // YYYY-MM-DD
  client: string;
  product: string;
  type: 'Subscription' | 'Setup Fee' | 'Monthly Subs' | 'Milestone' | 'Domain Reimbursement' | string;
  amount: number;
  currency: Currency;
  amountBDT: number;
  status: 'Realized' | 'Pending';
  isRecurring: boolean;
  mrrContribution?: number; // Calculated BDT value for MRR if active & recurring
  fileLink?: string;
  note?: string;
}

export interface Investment {
  id: string;
  date: string;
  owner: 'Jahangir Hossain' | 'Mottasin Pahlovi';
  type: 'Cash Injection' | 'Operating Expense Borne' | 'Sweat Equity (Salary)';
  amountBDT: number;
  note: string;
}

export interface ExchangeRate {
  month: string; // YYYY-MM, e.g., "2025-08"
  rate: number; // e.g., 118.5
}

export interface Product {
  id: string;
  name: string;
  domain?: string;
  description?: string;
}
