import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Transaction, CurrencyCode } from '../types/finance';
import { formatCurrency } from '../utils/storage';
import { DonutChart } from './charts/DonutChart';
import { BarChart, MonthlyBarData } from './charts/BarChart';
import { TrendChart } from './charts/TrendChart';
import {
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Percent,
  CheckCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AnalyticsViewProps {
  expenses: Transaction[];
  income: Transaction[];
  currency: CurrencyCode;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  expenses,
  income,
  currency,
}) => {
  const totalIncome = income.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, (totalSavings / totalIncome) * 100) : 0;

  // 1. Group Expenses by Category
  const expenseCatMap: Record<string, { amount: number; count: number }> = {};
  expenses.forEach((e) => {
    const cat = e.category || 'Other';
    if (!expenseCatMap[cat]) expenseCatMap[cat] = { amount: 0, count: 0 };
    expenseCatMap[cat].amount += Number(e.amount) || 0;
    expenseCatMap[cat].count += 1;
  });

  const expenseCategoryList = Object.entries(expenseCatMap)
    .map(([cat, d]) => ({
      category: cat,
      amount: d.amount,
      count: d.count,
      percentage: totalExpenses > 0 ? (d.amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 2. Group Income by Category
  const incomeCatMap: Record<string, { amount: number; count: number }> = {};
  income.forEach((i) => {
    const cat = i.category || 'Salary';
    if (!incomeCatMap[cat]) incomeCatMap[cat] = { amount: 0, count: 0 };
    incomeCatMap[cat].amount += Number(i.amount) || 0;
    incomeCatMap[cat].count += 1;
  });

  const incomeCategoryList = Object.entries(incomeCatMap)
    .map(([cat, d]) => ({
      category: cat,
      amount: d.amount,
      count: d.count,
      percentage: totalIncome > 0 ? (d.amount / totalIncome) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 3. Monthly Aggregation
  const monthlyDataMap: Record<string, { income: number; expenses: number }> = {};

  const addMonthRecord = (dateStr: string, amt: number, type: 'income' | 'expenses') => {
    if (!dateStr) return;
    const key = dateStr.slice(0, 7);
    if (!monthlyDataMap[key]) monthlyDataMap[key] = { income: 0, expenses: 0 };
    monthlyDataMap[key][type] += amt;
  };

  income.forEach((i) => addMonthRecord(i.date, Number(i.amount) || 0, 'income'));
  expenses.forEach((e) => addMonthRecord(e.date, Number(e.amount) || 0, 'expenses'));

  const sortedMonths = Object.keys(monthlyDataMap).sort();

  const monthlyBarData: MonthlyBarData[] = sortedMonths.map((mKey) => {
    const [y, m] = mKey.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, 1);
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return {
      month: label,
      income: monthlyDataMap[mKey].income,
      expenses: monthlyDataMap[mKey].expenses,
    };
  });

  const trendData = sortedMonths.map((mKey) => {
    const [y, m] = mKey.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, 1);
    const label = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const inc = monthlyDataMap[mKey].income;
    const exp = monthlyDataMap[mKey].expenses;
    return {
      dateLabel: label,
      income: inc,
      expenses: exp,
      netSavings: inc - exp,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Charts & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Clear visual charts of where your money comes from, where it goes, and how your savings grow over time.
          </p>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Income</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {formatCurrency(totalIncome, currency)}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{income.length} income entries</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Expenses</span>
            <span className="text-lg">💸</span>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {formatCurrency(totalExpenses, currency)}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{expenses.length} expenses</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Money Left (Savings)</span>
            <span className="text-lg">💵</span>
          </div>
          <div className="mt-3">
            <h2
              className={`text-2xl font-black tabular-nums ${
                totalSavings >= 0 ? 'text-cyan-500' : 'text-rose-500'
              }`}
            >
              {formatCurrency(totalSavings, currency)}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalSavings >= 0 ? 'Saved in pocket' : 'Spent more than earned'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Savings Rate</span>
            <span className="text-lg">📈</span>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {savingsRate.toFixed(1)}%
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {savingsRate >= 20 ? 'Great job! Saving 20%+' : 'Aim for 20% savings'}
            </p>
          </div>
        </div>
      </div>

      {/* Savings Progress Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🎯 Your Savings Progress</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              How much of your earned money you managed to keep
            </p>
          </div>
          <span className="text-base font-bold text-cyan-500 tabular-nums">
            {savingsRate.toFixed(1)}% Saved
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
          />
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {totalIncome === 0
            ? 'Add income and expenses to track your savings progress.'
            : totalSavings > 0
            ? `You have saved ${formatCurrency(totalSavings, currency)} out of ${formatCurrency(totalIncome, currency)} total earned.`
            : `Your expenses were ${formatCurrency(Math.abs(totalSavings), currency)} higher than your income.`}
        </p>
      </div>

      {/* 2-Column Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-rose-500" />
              <span>Expenses by Category</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              See what percentage of your spending goes to each category
            </p>
          </div>
          <DonutChart
            data={expenseCategoryList.map((e) => ({ label: e.category, value: e.amount }))}
            currency={currency}
          />
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-500" />
              <span>Income Sources</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Where your money comes from (Salary, Freelance, Gifts, etc.)
            </p>
          </div>
          <DonutChart
            data={incomeCategoryList.map((i) => ({ label: i.category, value: i.amount }))}
            currency={currency}
          />
        </div>
      </div>

      {/* Monthly Bar Comparison */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
            <span>Income vs Expenses (Month by Month)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare how much you earned vs spent in each month
          </p>
        </div>
        <BarChart data={monthlyBarData} currency={currency} />
      </div>

      {/* Trend Line Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <span>Monthly Financial Trend</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track how your earnings, spending, and savings change over time
          </p>
        </div>
        <TrendChart data={trendData} currency={currency} />
      </div>

      {/* Detailed Category Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Expense Breakdown by Category
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed list of spending with percentages
            </p>
          </div>

          <div className="space-y-3">
            {expenseCategoryList.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No expense records logged yet.</p>
            ) : (
              expenseCategoryList.map((item) => (
                <div
                  key={item.category}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.category}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-2">
                        {item.count} items ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatCurrency(item.amount, currency)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Income Breakdown by Source
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed list of earnings with percentages
            </p>
          </div>

          <div className="space-y-3">
            {incomeCategoryList.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No income records logged yet.</p>
            ) : (
              incomeCategoryList.map((item) => (
                <div
                  key={item.category}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.category}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-2">
                        {item.count} items ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(item.amount, currency)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
