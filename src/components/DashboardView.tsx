import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Transaction,
  CurrencyCode,
  MoneyLeakItem,
  CategoryBudget,
} from '../types/finance';
import {
  formatCurrency,
  formatDate,
  exportExpensesCSV,
  exportIncomeCSV,
  exportAllCSV,
  backupData,
} from '../utils/storage';
import { DonutChart } from './charts/DonutChart';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  TrendingUp,
  Download,
  Upload,
  Search,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldAlert,
  Zap,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { exportCompleteWorkbookToExcel, exportExpensesToExcel, exportIncomeToExcel } from '../utils/excelExport';
import { ActiveTab } from './Sidebar';

interface DashboardViewProps {
  expenses: Transaction[];
  income: Transaction[];
  budgets: CategoryBudget[];
  currency: CurrencyCode;
  onNavigate: (tab: ActiveTab) => void;
  onOpenAddModal: (type: 'expense' | 'income') => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string, type: 'expense' | 'income') => void;
  topLeak?: MoneyLeakItem | null;
  onRestoreClick: () => void;
  onOpenDownloadSheet?: () => void;
  onOpenDeleteAllModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  income,
  budgets,
  currency,
  onNavigate,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  topLeak,
  onRestoreClick,
  onOpenDownloadSheet,
  onOpenDeleteAllModal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const totalIncome = income.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const currentBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (currentBalance / totalIncome) * 100 : 0;

  // Combine and sort recent transactions
  const allTransactions: Transaction[] = [...expenses, ...income].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredTransactions = allTransactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      const cat = (tx.category || '').toLowerCase();
      return desc.includes(q) || cat.includes(q);
    }
    return true;
  });

  const recentTransactions = filteredTransactions.slice(0, 8);

  // Group expenses by category for Donut preview
  const expenseCatTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const c = e.category || 'Other';
    expenseCatTotals[c] = (expenseCatTotals[c] || 0) + (Number(e.amount) || 0);
  });

  const expenseChartData = Object.entries(expenseCatTotals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Friendly Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            My Money Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            See how much money you earned, spent, and saved in one simple place.
          </p>
        </div>

        {/* Balance Status Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold tabular-nums flex items-center gap-2 shadow-xs">
            <span className="text-slate-500 dark:text-slate-400">Total Balance:</span>
            <span
              className={`font-bold ${
                currentBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {currentBalance >= 0 ? '+' : ''}
              {formatCurrency(currentBalance, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Empty Zero-Data Welcome Banner */}
      {expenses.length === 0 && income.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-transparent border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        >
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>👋 Welcome! Your tracker is fresh and clean</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              No transactions recorded yet. Tap below to log your first spend or earning.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenAddModal('expense')}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              + Add First Expense
            </button>
            <button
              onClick={() => onOpenAddModal('income')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              + Add First Income
            </button>
          </div>
        </motion.div>
      )}

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-lg dark:hover:border-emerald-500/40 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Income
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {formatCurrency(totalIncome, currency)}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Money you received ({income.length} times)
            </p>
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-500/50 hover:shadow-lg dark:hover:border-rose-500/40 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {formatCurrency(totalExpenses, currency)}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Money you spent ({expenses.length} times)
            </p>
          </div>
        </motion.div>

        {/* Money Left Over / Balance */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-cyan-500/50 hover:shadow-lg dark:hover:border-cyan-500/40 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Money Left Over
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2
              className={`text-2xl font-black tabular-nums ${
                currentBalance >= 0
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(currentBalance, currency)}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {currentBalance >= 0 ? 'Remaining in your pocket' : 'You spent more than you earned'}
            </p>
          </div>
        </motion.div>

        {/* Savings Rate */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 hover:shadow-lg dark:hover:border-indigo-500/40 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Savings Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {savingsRate.toFixed(1)}%
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {savingsRate >= 20 ? 'Great job! Saving 20%+ is ideal.' : 'Try aiming for 20% savings.'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Money Leak Highlight Alert */}
      {topLeak ? (
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.15 }}
          onClick={() => onNavigate('leaks')}
          className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-500/40 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-amber-500/60 transition-all group shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                  Money Leak Tip
                </span>
                <span className="text-xs text-rose-500 font-semibold">
                  Opportunity to Save
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                {topLeak.title}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                {topLeak.description}
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 shadow-md group-hover:translate-x-0.5 transition-all">
            <span>See How to Save</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      ) : null}

      {/* Quick Action Station */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-500" />
            <span>Quick Shortcuts</span>
          </h2>
          <span className="text-xs text-slate-400">One-tap actions</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onOpenAddModal('expense')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors"
          >
            <ArrowDownCircle className="w-5 h-5 mb-1.5 text-rose-500" />
            <span>Add Expense</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onOpenAddModal('income')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors"
          >
            <ArrowUpCircle className="w-5 h-5 mb-1.5 text-emerald-500" />
            <span>Add Income</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('leaks')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs transition-colors"
          >
            <ShieldAlert className="w-5 h-5 mb-1.5 text-amber-500" />
            <span>Find Money Leaks</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('analytics')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/20 hover:bg-cyan-100/60 dark:hover:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold text-xs transition-colors"
          >
            <TrendingUp className="w-5 h-5 mb-1.5 text-cyan-500" />
            <span>View Charts</span>
          </motion.button>
        </div>
      </div>

      {/* Spending Breakdown Preview (Donut) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Where Your Money Goes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              See what you spend the most on (Food, Shopping, Bills, Travel, etc.)
            </p>
          </div>
          <button
            onClick={() => onNavigate('analytics')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>See Detailed Charts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <DonutChart data={expenseChartData} currency={currency} />
      </div>

      {/* Recent Transactions List with Search & Type Filter */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your latest income and expenses
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Toggle */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'expense'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'income'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Income
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-xs min-w-[580px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 pr-4">Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => {
                  const isExp = tx.type === 'expense';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {tx.category}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        {tx.payment || '—'}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-bold tabular-nums whitespace-nowrap ${
                          isExp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isExp ? '-' : '+'}
                        {formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id, tx.type)}
                            className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <span>Download &amp; Backup Data</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download your complete expense sheets to view in Excel anytime — even without internet
            </p>
          </div>
          {onOpenDownloadSheet && (
            <button
              onClick={onOpenDownloadSheet}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View all download options</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* 1. Complete Excel Workbook (Featured) */}
          <button
            onClick={() => onOpenDownloadSheet ? onOpenDownloadSheet() : exportCompleteWorkbookToExcel(expenses, income, budgets, currency)}
            className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-emerald-500/50 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  Complete Excel Sheet
                </p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-mono">
                  OFFLINE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Full statement (.xlsx)
              </p>
            </div>
          </button>

          {/* 2. Expenses Only (.xlsx) */}
          <button
            onClick={() => exportExpensesToExcel(expenses, currency)}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-rose-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                Download Expenses
              </p>
              <p className="text-[10px] text-slate-400 truncate">Expenses .xlsx file</p>
            </div>
          </button>

          {/* 3. Income Only (.xlsx) */}
          <button
            onClick={() => exportIncomeToExcel(income, currency)}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                Download Income
              </p>
              <p className="text-[10px] text-slate-400 truncate">Income .xlsx file</p>
            </div>
          </button>

          {/* 4. Complete Backup / Restore */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => backupData(expenses, income, budgets, [])}
              title="Save full JSON backup"
              className="flex-1 flex items-center justify-center gap-1.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-amber-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>Backup</span>
            </button>
            <button
              onClick={onRestoreClick}
              title="Restore from JSON backup"
              className="flex-1 flex items-center justify-center gap-1.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>Restore</span>
            </button>
          </div>

          {/* 5. Delete All Data (Fresh clean slate) */}
          {onOpenDeleteAllModal && (
            <button
              onClick={onOpenDeleteAllModal}
              title="Permanently erase all data and reset to zero"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 text-left transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 truncate">
                  Delete All Data
                </p>
                <p className="text-[10px] text-slate-400 truncate">Reset to clean zero</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
