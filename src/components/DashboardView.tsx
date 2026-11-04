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
  AlertTriangle,
  Download,
  Upload,
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldAlert,
  Zap,
  Radio,
  Sparkles,
  Activity,
  Layers,
} from 'lucide-react';
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
      {/* Futuristic Header with Live Telemetry Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono tracking-wider uppercase font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE TELEMETRY</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              STATUS: NOMINAL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Financial Command Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time monetary radar, liquidity tracking, and automated cashflow diagnostics.
          </p>
        </div>

        {/* Currency / Net Flow Indicator */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono tabular-nums flex items-center gap-2 shadow-xs">
            <Activity className="w-4 h-4 text-cyan-500" />
            <span className="text-slate-500 dark:text-slate-400">NET RUN-RATE:</span>
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

      {/* Top 4 Holographic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-lg dark:hover:border-emerald-500/40 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
              INFLOW CAPITAL
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums font-mono">
              {formatCurrency(totalIncome, currency)}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              {income.length} credits verified
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
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
              OUTFLOW EXPENDITURE
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums font-mono">
              {formatCurrency(totalExpenses, currency)}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              {expenses.length} debits verified
            </p>
          </div>
        </motion.div>

        {/* Current Net Balance */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-cyan-500/50 hover:shadow-lg dark:hover:border-cyan-500/40 relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
              NET LIQUID RESERVE
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2
              className={`text-2xl font-black tabular-nums font-mono ${
                currentBalance >= 0
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(currentBalance, currency)}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              {currentBalance >= 0 ? 'Liquid surplus intact' : 'Negative cashflow deficit'}
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
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
              SAVINGS EFFICIENCY
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums font-mono">
              {savingsRate.toFixed(1)}%
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              {savingsRate >= 20 ? 'Optimal benchmark achieved' : 'Under 20% safe margin'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Futuristic Money Leak Highlight Alert */}
      {topLeak ? (
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.15 }}
          onClick={() => onNavigate('leaks')}
          className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-500/40 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-amber-500/60 transition-all group glow-cyan"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                  RADAR SONAR ALERT
                </span>
                <span className="text-[10px] font-mono text-rose-500 font-bold">
                  DRAIN DETECTED
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
            <span>Engage Leak Repair</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      ) : null}

      {/* Cybernetic Quick Action Station */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-500" />
            <span>Operational Dispatch Hub</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">INSTANT DISPATCH</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onOpenAddModal('expense')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors"
          >
            <ArrowDownCircle className="w-5 h-5 mb-1.5 text-rose-500" />
            <span>Log Expense</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onOpenAddModal('income')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors"
          >
            <ArrowUpCircle className="w-5 h-5 mb-1.5 text-emerald-500" />
            <span>Credit Income</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('leaks')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs transition-colors"
          >
            <Radio className="w-5 h-5 mb-1.5 text-amber-500" />
            <span>Scan Leaks</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('analytics')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/20 hover:bg-cyan-100/60 dark:hover:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold text-xs transition-colors"
          >
            <TrendingUp className="w-5 h-5 mb-1.5 text-cyan-500" />
            <span>View Analytics</span>
          </motion.button>
        </div>
      </div>

      {/* Spending Breakdown Preview (Donut) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Capital Flow Allocation</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Where your money goes by category vector
            </p>
          </div>
          <button
            onClick={() => onNavigate('analytics')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 font-mono"
          >
            <span>ANALYTICS ENGINE</span>
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
              Recent Transactions Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified debit and credit log
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
                Debits
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'income'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Credits
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-xs min-w-[580px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px] font-mono">
                <th className="py-2.5 pr-4">Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No matching ledger items found.
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
                      <td className="py-3 pr-4 font-sans font-medium text-slate-900 dark:text-slate-100">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-sans">
                        {tx.category}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-sans">
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
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id, tx.type)}
                            className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded transition-colors"
                            title="Delete transaction"
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
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Data Storage & Archive Protocol
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Encrypted local exports, comma-separated datasets, and JSON backup restoration
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          <button
            onClick={() => exportExpensesCSV(expenses)}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-rose-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                Export Expenses
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">expenses.csv</p>
            </div>
          </button>

          <button
            onClick={() => exportIncomeCSV(income)}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                Export Income
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">income.csv</p>
            </div>
          </button>

          <button
            onClick={() => exportAllCSV(expenses, income)}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-cyan-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                All Transactions
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">Complete archive</p>
            </div>
          </button>

          <button
            onClick={() => backupData(expenses, income, budgets, [])}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-amber-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                Backup JSON
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">Local database</p>
            </div>
          </button>

          <button
            onClick={onRestoreClick}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                Restore Backup
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">Import JSON</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
