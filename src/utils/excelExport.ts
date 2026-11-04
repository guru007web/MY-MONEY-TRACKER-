import * as XLSX from 'xlsx';
import { Transaction, CategoryBudget, CurrencyCode } from '../types/finance';
import { CURRENCIES, getTodayDateString } from './storage';

/**
 * Helper to download an ArrayBuffer or binary string as a file in browser
 */
function downloadBlob(buffer: ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Safe writeFile with manual Blob fallback for iframe and offline safety
 */
function saveWorkbook(wb: XLSX.WorkBook, filename: string) {
  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadBlob(
      wbout,
      filename,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  } catch (err) {
    console.error('Error generating Excel file via Blob, falling back to XLSX.writeFile:', err);
    XLSX.writeFile(wb, filename);
  }
}

/**
 * 1. Export Expenses Sheet (.xlsx)
 * Generates a clean, formatted Excel spreadsheet of all expenses
 */
export function exportExpensesToExcel(
  expenses: Transaction[],
  currency: CurrencyCode = 'INR'
): boolean {
  if (expenses.length === 0) {
    alert('You have no expenses recorded yet to export.');
    return false;
  }

  const currencySymbol = CURRENCIES[currency]?.symbol || '₹';
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Rows array format (AOA - Array of Arrays) gives maximum control over formatting
  const rows: (string | number)[][] = [
    ['WHERE DOES MY MONEY GO? - EXPENSE SHEET'],
    [`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} | Currency: ${currency} (${currencySymbol})`],
    [`Total Recorded Expenses: ${expenses.length} items | Total Spent: ${currencySymbol}${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    [], // empty line
    ['#', 'Date', 'Category', 'Description / Item', 'Payment Method', `Amount (${currencySymbol})`, 'Notes']
  ];

  // Sort newest first
  const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  sorted.forEach((item, index) => {
    rows.push([
      index + 1,
      item.date || '',
      item.category || 'Other',
      item.description || 'Expense',
      item.payment || 'UPI',
      Number(item.amount) || 0,
      item.notes || ''
    ]);
  });

  // Summary row at bottom
  rows.push([]);
  rows.push(['', '', '', '', 'TOTAL EXPENSES:', totalAmount, '']);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for readability in Excel
  ws['!cols'] = [
    { wch: 6 },  // #
    { wch: 14 }, // Date
    { wch: 20 }, // Category
    { wch: 34 }, // Description
    { wch: 18 }, // Payment Method
    { wch: 16 }, // Amount
    { wch: 28 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'My Expenses');

  saveWorkbook(wb, `Expenses_Sheet_${getTodayDateString()}.xlsx`);
  return true;
}

/**
 * 2. Export Income Sheet (.xlsx)
 * Generates an Excel spreadsheet of all income entries
 */
export function exportIncomeToExcel(
  income: Transaction[],
  currency: CurrencyCode = 'INR'
): boolean {
  if (income.length === 0) {
    alert('You have no income recorded yet to export.');
    return false;
  }

  const currencySymbol = CURRENCIES[currency]?.symbol || '₹';
  const totalAmount = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const rows: (string | number)[][] = [
    ['WHERE DOES MY MONEY GO? - INCOME SHEET'],
    [`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} | Currency: ${currency} (${currencySymbol})`],
    [`Total Recorded Income: ${income.length} items | Total Earned: ${currencySymbol}${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    [],
    ['#', 'Date', 'Income Category / Source', 'Description', `Amount (${currencySymbol})`, 'Notes']
  ];

  const sorted = [...income].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  sorted.forEach((item, index) => {
    rows.push([
      index + 1,
      item.date || '',
      item.category || 'Other',
      item.description || 'Income',
      Number(item.amount) || 0,
      item.notes || ''
    ]);
  });

  rows.push([]);
  rows.push(['', '', '', 'TOTAL INCOME:', totalAmount, '']);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 34 },
    { wch: 18 },
    { wch: 28 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'My Income');

  saveWorkbook(wb, `Income_Sheet_${getTodayDateString()}.xlsx`);
  return true;
}

/**
 * 3. Complete Financial Workbook (.xlsx)
 * Multi-tab workbook:
 * Tab 1: Overview Summary & Category Breakdown
 * Tab 2: Expenses
 * Tab 3: Income
 * Tab 4: Monthly Category Limits
 */
export function exportCompleteWorkbookToExcel(
  expenses: Transaction[],
  income: Transaction[],
  budgets: CategoryBudget[] = [],
  currency: CurrencyCode = 'INR'
): boolean {
  if (expenses.length === 0 && income.length === 0) {
    alert('You have no transaction records to export.');
    return false;
  }

  const currencySymbol = CURRENCIES[currency]?.symbol || '₹';
  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalIncome = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const wb = XLSX.utils.book_new();

  // --- SHEET 1: OVERVIEW SUMMARY ---
  const overviewRows: (string | number)[][] = [
    ['WHERE DOES MY MONEY GO? - COMPLETE FINANCIAL STATEMENT'],
    [`Downloaded on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`],
    ['Note: This sheet was saved on your device and can be viewed anytime without internet connection.'],
    [],
    ['KEY FINANCIAL SUMMARY', ''],
    ['Metric', `Value (${currencySymbol})`],
    ['Total Income (Money In)', totalIncome],
    ['Total Expenses (Money Out)', totalExpense],
    ['Money Left Over (Net Savings)', netSavings],
    ['Savings Rate', `${savingsRate}%`],
    [],
    ['EXPENSES BY CATEGORY BREAKDOWN', ''],
    ['Category', `Total Spent (${currencySymbol})`, 'Percentage of Expenses', 'Transactions Count']
  ];

  // Category totals map
  const catMap: Record<string, { total: number; count: number }> = {};
  expenses.forEach((e) => {
    const c = e.category || 'Other';
    if (!catMap[c]) catMap[c] = { total: 0, count: 0 };
    catMap[c].total += Number(e.amount) || 0;
    catMap[c].count += 1;
  });

  const sortedCategories = Object.entries(catMap).sort((a, b) => b[1].total - a[1].total);
  sortedCategories.forEach(([categoryName, data]) => {
    const pct = totalExpense > 0 ? ((data.total / totalExpense) * 100).toFixed(1) + '%' : '0%';
    overviewRows.push([categoryName, data.total, pct, data.count]);
  });

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [
    { wch: 32 },
    { wch: 22 },
    { wch: 24 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Summary Overview');

  // --- SHEET 2: EXPENSES ---
  const expenseRows: (string | number)[][] = [
    ['ITEMIZED EXPENSES LIST'],
    [`Total Records: ${expenses.length} | Total: ${currencySymbol}${totalExpense.toFixed(2)}`],
    [],
    ['#', 'Date', 'Category', 'Description / Spent On', 'Payment Method', `Amount (${currencySymbol})`, 'Notes']
  ];
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  sortedExpenses.forEach((item, idx) => {
    expenseRows.push([
      idx + 1,
      item.date || '',
      item.category || 'Other',
      item.description || 'Expense',
      item.payment || 'UPI',
      Number(item.amount) || 0,
      item.notes || ''
    ]);
  });
  expenseRows.push([]);
  expenseRows.push(['', '', '', '', 'TOTAL EXPENSES:', totalExpense, '']);

  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
  wsExpenses['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 20 },
    { wch: 34 },
    { wch: 18 },
    { wch: 16 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'All Expenses');

  // --- SHEET 3: INCOME ---
  const incomeRows: (string | number)[][] = [
    ['ITEMIZED INCOME LIST'],
    [`Total Records: ${income.length} | Total: ${currencySymbol}${totalIncome.toFixed(2)}`],
    [],
    ['#', 'Date', 'Income Category / Source', 'Description', `Amount (${currencySymbol})`, 'Notes']
  ];
  const sortedIncome = [...income].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  sortedIncome.forEach((item, idx) => {
    incomeRows.push([
      idx + 1,
      item.date || '',
      item.category || 'Other',
      item.description || 'Income',
      Number(item.amount) || 0,
      item.notes || ''
    ]);
  });
  incomeRows.push([]);
  incomeRows.push(['', '', '', 'TOTAL INCOME:', totalIncome, '']);

  const wsIncome = XLSX.utils.aoa_to_sheet(incomeRows);
  wsIncome['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 34 },
    { wch: 18 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsIncome, 'All Income');

  // --- SHEET 4: BUDGETS & LIMITS ---
  if (budgets.length > 0) {
    const budgetRows: (string | number)[][] = [
      ['MONTHLY CATEGORY SPENDING LIMITS'],
      ['Check your budget limits vs how much has been spent so far'],
      [],
      ['Category', `Monthly Limit (${currencySymbol})`, `Spent So Far (${currencySymbol})`, `Remaining (${currencySymbol})`, 'Status']
    ];

    budgets.forEach((b) => {
      const spent = catMap[b.category]?.total || 0;
      const remaining = Math.max(0, b.monthlyLimit - spent);
      const isOver = b.monthlyLimit > 0 && spent > b.monthlyLimit;
      const status = b.monthlyLimit === 0 ? 'No Limit Set' : isOver ? 'OVER BUDGET' : 'Within Budget';
      budgetRows.push([b.category, b.monthlyLimit, spent, remaining, status]);
    });

    const wsBudgets = XLSX.utils.aoa_to_sheet(budgetRows);
    wsBudgets['!cols'] = [
      { wch: 24 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsBudgets, 'Monthly Limits');
  }

  saveWorkbook(wb, `My_Money_Complete_Spreadsheet_${getTodayDateString()}.xlsx`);
  return true;
}
