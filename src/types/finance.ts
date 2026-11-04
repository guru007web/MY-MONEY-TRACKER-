export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Travel & Commute'
  | 'Shopping'
  | 'Bills & Utilities'
  | 'Rent & Housing'
  | 'Education'
  | 'Entertainment'
  | 'Health & Medical'
  | 'Subscriptions'
  | 'Other';

export type IncomeCategory =
  | 'Salary'
  | 'Pocket Money'
  | 'Freelance'
  | 'Business'
  | 'Investments'
  | 'Gift'
  | 'Scholarship'
  | 'Other';

export type PaymentMethod = 'UPI' | 'Cash' | 'Card' | 'Net Banking' | 'Other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string;
  payment?: PaymentMethod | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  syncStatus?: 'synced' | 'pending';
}

export interface CategoryBudget {
  category: string;
  monthlyLimit: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export interface MoneyLeakItem {
  id: string;
  title: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  type: 'micro_spend' | 'top_drain' | 'subscription_creep' | 'weekend_surge' | 'budget_breach';
  monthlyImpact: number;
  yearlyImpact: number;
  transactionCount?: number;
  description: string;
  recommendation: string;
  potentialSavingsPercentage: number;
}
