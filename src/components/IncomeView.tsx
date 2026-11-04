import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Transaction,
  CurrencyCode,
  IncomeCategory,
} from '../types/finance';
import {
  formatCurrency,
  formatDate,
  DEFAULT_INCOME_CATEGORIES,
  getTodayDateString,
  generateID,
} from '../utils/storage';
import {
  ArrowUpCircle,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { exportIncomeToExcel } from '../utils/excelExport';

interface IncomeViewProps {
  income: Transaction[];
  currency: CurrencyCode;
  onAddIncome: (income: Transaction) => void;
  onEditIncome: (income: Transaction) => void;
  onDeleteIncome: (id: string) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  income,
  currency,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(DEFAULT_INCOME_CATEGORIES[0]);
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const totalIncomeAmount = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const presets = [
    { label: 'Monthly Salary', amount: currency === 'INR' ? 65000 : 3500, cat: 'Salary' },
    { label: 'Freelance / Side Project', amount: currency === 'INR' ? 15000 : 800, cat: 'Freelance' },
    { label: 'Pocket Money', amount: currency === 'INR' ? 5000 : 250, cat: 'Pocket Money' },
    { label: 'Investment Return / Gift', amount: currency === 'INR' ? 3200 : 150, cat: 'Investments' },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setDescription(p.label);
    setAmount(String(p.amount));
    setCategory(p.cat);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!description.trim()) {
      alert('Please enter where this money came from.');
      return;
    }

    const newIncome: Transaction = {
      id: generateID(),
      type: 'income',
      amount: Math.round(parsedAmount * 100) / 100,
      category,
      date: date || getTodayDateString(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddIncome(newIncome);
    setDescription('');
    setAmount('');
  };

  const filtered = income.filter((i) => {
    if (selectedCategory !== 'ALL' && i.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const desc = (i.description || '').toLowerCase();
      const cat = (i.category || '').toLowerCase();
      return desc.includes(q) || cat.includes(q);
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount_desc') return b.amount - a.amount;
    if (sortBy === 'amount_asc') return a.amount - b.amount;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Income
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Record all the money coming in — salary, freelance work, pocket money, business profits, and gifts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => exportIncomeToExcel(income, currency)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0"
            title="Download income sheet as Excel (.xlsx) file to view offline"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Download Excel Sheet</span>
          </motion.button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 text-white flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-wider text-emerald-400 block font-semibold">
            Total Money Received
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 tabular-nums mt-1">
            +{formatCurrency(totalIncomeAmount, currency)}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {income.length} income entries logged
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-2xl shrink-0 relative z-10">
          💰
        </div>
      </div>

      {/* Add New Income Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              ➕ Add Income
            </h2>
          </div>
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Quick Add:
            </span>
            {presets.map((p) => (
              <button
                type="button"
                key={p.label}
                onClick={() => handleApplyPreset(p)}
                className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Income Source
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              >
                {DEFAULT_INCOME_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description & Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Where did this money come from? (e.g. October Salary, Freelance project, Pocket money)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Save Income</span>
            </motion.button>
          </div>
        </form>
      </div>

      {/* Income History Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              All Income Records
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filtered.length} of {income.length} records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search income..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Sources</option>
              {DEFAULT_INCOME_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>

            <button
              onClick={() => exportIncomeToExcel(income, currency)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-100 rounded-lg font-medium transition-colors"
              title="Download Excel Sheet (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-xs min-w-[580px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 pr-4">Description</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No income records match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">
                      {item.description}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {item.category}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                      +{formatCurrency(item.amount, currency)}
                    </td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditIncome(item)}
                          className="px-2 py-1 text-xs font-semibold rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteIncome(item.id)}
                          className="px-2 py-1 text-xs font-semibold rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
