import { Transaction, CategoryBudget, SavingsGoal, CurrencyCode, CurrencyConfig } from '../types/finance';

export const EXPENSE_STORAGE_KEY = 'expenses';
export const INCOME_STORAGE_KEY = 'income';
export const BUDGETS_STORAGE_KEY = 'category_budgets';
export const GOALS_STORAGE_KEY = 'savings_goals';
export const SETTINGS_STORAGE_KEY = 'user_settings';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)', locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)', locale: 'ja-JP' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AU$)', locale: 'en-AU' },
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Travel & Commute',
  'Shopping',
  'Bills & Utilities',
  'Rent & Housing',
  'Entertainment',
  'Health & Medical',
  'Education',
  'Subscriptions',
  'Other',
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Pocket Money',
  'Freelance',
  'Business',
  'Investments',
  'Gift',
  'Scholarship',
  'Other',
];

export const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Net Banking', 'Other'];

export function generateID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const num = Number(amount) || 0;
  const config = CURRENCIES[currency] || CURRENCIES.INR;
  try {
    return num.toLocaleString(config.locale, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
  } catch {
    return `${config.symbol}${num.toLocaleString()}`;
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-');
    if (year && month && day) {
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString();
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadExpenses(): Transaction[] {
  try {
    const raw = localStorage.getItem(EXPENSE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      id: item.id || generateID(),
      type: 'expense' as const,
      amount: Number(item.amount) || 0,
      category: item.category || 'Other',
      date: item.date || getTodayDateString(),
      description: item.description || 'Expense',
      payment: item.payment || 'UPI',
    }));
  } catch (err) {
    console.error('Error loading expenses:', err);
    return [];
  }
}

export function saveExpenses(expenses: Transaction[]): void {
  try {
    localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.error('Error saving expenses:', err);
  }
}

export function loadIncomes(): Transaction[] {
  try {
    const raw = localStorage.getItem(INCOME_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      id: item.id || generateID(),
      type: 'income' as const,
      amount: Number(item.amount) || 0,
      category: item.category || 'Salary',
      date: item.date || getTodayDateString(),
      description: item.description || 'Income',
    }));
  } catch (err) {
    console.error('Error loading income:', err);
    return [];
  }
}

export function saveIncomes(incomes: Transaction[]): void {
  try {
    localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(incomes));
  } catch (err) {
    console.error('Error saving incomes:', err);
  }
}

export function loadBudgets(): CategoryBudget[] {
  try {
    const raw = localStorage.getItem(BUDGETS_STORAGE_KEY);
    if (!raw) {
      return [
        { category: 'Food & Dining', monthlyLimit: 8000 },
        { category: 'Groceries', monthlyLimit: 6000 },
        { category: 'Travel & Commute', monthlyLimit: 4000 },
        { category: 'Shopping', monthlyLimit: 5000 },
        { category: 'Entertainment', monthlyLimit: 3000 },
        { category: 'Subscriptions', monthlyLimit: 1500 },
      ];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBudgets(budgets: CategoryBudget[]): void {
  try {
    localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
  } catch (err) {
    console.error('Error saving budgets:', err);
  }
}

export function loadGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) {
      return [
        {
          id: 'goal-1',
          title: 'Emergency Rainy Day Fund',
          targetAmount: 50000,
          currentAmount: 28500,
          targetDate: '2026-12-31',
        },
        {
          id: 'goal-2',
          title: 'New Laptop / Tech Upgrade',
          targetAmount: 85000,
          currentAmount: 42000,
          targetDate: '2026-10-15',
        },
        {
          id: 'goal-3',
          title: 'Goa Holiday Trip',
          targetAmount: 25000,
          currentAmount: 18000,
          targetDate: '2026-12-20',
        },
      ];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGoals(goals: SavingsGoal[]): void {
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (err) {
    console.error('Error saving goals:', err);
  }
}

export function loadCurrency(): CurrencyCode {
  try {
    const saved = localStorage.getItem('user_currency') as CurrencyCode;
    if (saved && CURRENCIES[saved]) return saved;
  } catch {
    // fallback
  }
  return 'INR';
}

export function saveCurrency(currency: CurrencyCode): void {
  try {
    localStorage.setItem('user_currency', currency);
  } catch (err) {
    console.error('Error saving currency:', err);
  }
}

/* =========================================================
   SAMPLE DEMO DATA
   Gives rich, realistic transactions for instant exploration
   ========================================================= */
export function getSampleDataset(): { expenses: Transaction[]; income: Transaction[] } {
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonth = prevMonthDate.toISOString().slice(0, 7);

  const income: Transaction[] = [
    {
      id: generateID(),
      type: 'income',
      amount: 65000,
      category: 'Salary',
      date: `${currentMonth}-01`,
      description: 'Monthly Corporate Salary Credit',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'income',
      amount: 14500,
      category: 'Freelance',
      date: `${currentMonth}-08`,
      description: 'UI/UX Design Contract Milestone',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'income',
      amount: 65000,
      category: 'Salary',
      date: `${prevMonth}-01`,
      description: 'Monthly Corporate Salary Credit',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'income',
      amount: 8000,
      category: 'Investments',
      date: `${prevMonth}-15`,
      description: 'Quarterly Mutual Fund Dividend',
      createdAt: new Date().toISOString(),
    },
  ];

  const expenses: Transaction[] = [
    {
      id: generateID(),
      type: 'expense',
      amount: 18000,
      category: 'Rent & Housing',
      date: `${currentMonth}-02`,
      description: 'Apartment Monthly Rent Transfer',
      payment: 'Net Banking',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 2400,
      category: 'Bills & Utilities',
      date: `${currentMonth}-03`,
      description: 'High-Speed Broadband & Electricity Bill',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 3200,
      category: 'Groceries',
      date: `${currentMonth}-04`,
      description: 'Blinkit Weekly Organic Staples & Veggies',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 650,
      category: 'Food & Dining',
      date: `${currentMonth}-05`,
      description: 'Zomato Late Night Biryani Dinner',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    // Micro-spends (Chai / coffee leak)
    {
      id: generateID(),
      type: 'expense',
      amount: 180,
      category: 'Food & Dining',
      date: `${currentMonth}-06`,
      description: 'Artisan Cafe Filter Coffee & Cookie',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 140,
      category: 'Food & Dining',
      date: `${currentMonth}-07`,
      description: 'Evening Tea & Samosa Stall with Colleagues',
      payment: 'Cash',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 220,
      category: 'Food & Dining',
      date: `${currentMonth}-08`,
      description: 'Quick Mid-day Cold Brew',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 190,
      category: 'Food & Dining',
      date: `${currentMonth}-09`,
      description: 'Morning Chai & Bun Maska Snack',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    // Subscriptions
    {
      id: generateID(),
      type: 'expense',
      amount: 649,
      category: 'Subscriptions',
      date: `${currentMonth}-04`,
      description: 'Netflix Premium 4K Plan',
      payment: 'Card',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 119,
      category: 'Subscriptions',
      date: `${currentMonth}-05`,
      description: 'Spotify Individual Premium Plan',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 1499,
      category: 'Subscriptions',
      date: `${currentMonth}-06`,
      description: 'Cult.fit Annual Gym Auto-Debit',
      payment: 'Card',
      createdAt: new Date().toISOString(),
    },
    // Weekend Dining & Shopping Surge
    {
      id: generateID(),
      type: 'expense',
      amount: 4200,
      category: 'Food & Dining',
      date: `${currentMonth}-07`, // Weekend
      description: 'Saturday Rooftop Brewery Dinner with Friends',
      payment: 'Card',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 3800,
      category: 'Shopping',
      date: `${currentMonth}-08`, // Weekend
      description: 'Uniqlo Casual Cotton Shirts & Linen Pants',
      payment: 'Card',
      createdAt: new Date().toISOString(),
    },
    // Commute
    {
      id: generateID(),
      type: 'expense',
      amount: 450,
      category: 'Travel & Commute',
      date: `${currentMonth}-09`,
      description: 'Uber Ride to Tech Park Meeting',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 800,
      category: 'Travel & Commute',
      date: `${currentMonth}-03`,
      description: 'Metro Card Monthly Smart Pass Recharge',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    // Medical & Other
    {
      id: generateID(),
      type: 'expense',
      amount: 1250,
      category: 'Health & Medical',
      date: `${currentMonth}-08`,
      description: 'Pharmacy Vitamins & Routine Prescription',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    // Previous month records for trends
    {
      id: generateID(),
      type: 'expense',
      amount: 18000,
      category: 'Rent & Housing',
      date: `${prevMonth}-02`,
      description: 'Apartment Monthly Rent Transfer',
      payment: 'Net Banking',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 6800,
      category: 'Food & Dining',
      date: `${prevMonth}-14`,
      description: 'Weekend Dining & Deliveries',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 5400,
      category: 'Groceries',
      date: `${prevMonth}-18`,
      description: 'Supermarket Grocery Stockup',
      payment: 'Card',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateID(),
      type: 'expense',
      amount: 2100,
      category: 'Bills & Utilities',
      date: `${prevMonth}-20`,
      description: 'Electricity & Gas Bill',
      payment: 'UPI',
      createdAt: new Date().toISOString(),
    },
  ];

  return { expenses, income };
}

/* =========================================================
   CSV EXPORT & IMPORT
   ========================================================= */
function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers
      .map((header) => {
        const value = item[header] ?? '';
        const text = String(value).replace(/"/g, '""');
        return `"${text}"`;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExpensesCSV(expenses: Transaction[]): void {
  if (expenses.length === 0) {
    alert('There are no expenses to export.');
    return;
  }
  const csvData = expenses.map((exp) => ({
    Description: exp.description,
    Category: exp.category,
    Date: exp.date,
    Payment: exp.payment || 'UPI',
    Amount: exp.amount,
  }));
  const csv = convertToCSV(csvData);
  downloadFile(csv, `expenses_${getTodayDateString()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportIncomeCSV(incomes: Transaction[]): void {
  if (incomes.length === 0) {
    alert('There is no income to export.');
    return;
  }
  const csvData = incomes.map((inc) => ({
    Description: inc.description,
    Category: inc.category,
    Date: inc.date,
    Amount: inc.amount,
  }));
  const csv = convertToCSV(csvData);
  downloadFile(csv, `income_${getTodayDateString()}.csv`, 'text/csv;charset=utf-8;');
}

export function exportAllCSV(expenses: Transaction[], incomes: Transaction[]): void {
  const all: Record<string, unknown>[] = [];
  expenses.forEach((e) => {
    all.push({
      Type: 'Expense',
      Description: e.description,
      Category: e.category,
      Date: e.date,
      Payment: e.payment || '',
      Amount: e.amount,
    });
  });
  incomes.forEach((i) => {
    all.push({
      Type: 'Income',
      Description: i.description,
      Category: i.category,
      Date: i.date,
      Payment: '',
      Amount: i.amount,
    });
  });

  if (all.length === 0) {
    alert('There are no transactions to export.');
    return;
  }
  const csv = convertToCSV(all);
  downloadFile(csv, `all_transactions_${getTodayDateString()}.csv`, 'text/csv;charset=utf-8;');
}

export function backupData(
  expenses: Transaction[],
  income: Transaction[],
  budgets: CategoryBudget[],
  goals: SavingsGoal[]
): void {
  const backup = {
    appName: 'Where Does My Money Go?',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    expenses,
    income,
    budgets,
    goals,
  };
  const json = JSON.stringify(backup, null, 2);
  downloadFile(json, `money_tracker_backup_${getTodayDateString()}.json`, 'application/json');
}
