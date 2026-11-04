import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Transaction,
  TransactionType,
  PaymentMethod,
  CurrencyCode,
} from '../types/finance';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  PAYMENT_METHODS,
  getTodayDateString,
  generateID,
  CURRENCIES,
} from '../utils/storage';
import { X, Plus, Check, Zap, Sparkles } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  initialTransaction?: Transaction | null;
  defaultType?: TransactionType;
  currency?: CurrencyCode;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
  defaultType = 'expense',
  currency = 'INR',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [payment, setPayment] = useState<PaymentMethod>('UPI');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(String(initialTransaction.amount));
      setCategory(initialTransaction.category);
      setDate(initialTransaction.date || getTodayDateString());
      setPayment((initialTransaction.payment as PaymentMethod) || 'UPI');
      setDescription(initialTransaction.description || '');
      setNotes(initialTransaction.notes || '');
    } else {
      setType(defaultType);
      setAmount('');
      setCategory(defaultType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES[0] : DEFAULT_INCOME_CATEGORIES[0]);
      setDate(getTodayDateString());
      setPayment('UPI');
      setDescription('');
      setNotes('');
    }
    setError('');
  }, [initialTransaction, defaultType, isOpen]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'expense') {
      if (!DEFAULT_EXPENSE_CATEGORIES.includes(category)) {
        setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
      }
    } else {
      if (!DEFAULT_INCOME_CATEGORIES.includes(category)) {
        setCategory(DEFAULT_INCOME_CATEGORIES[0]);
      }
    }
  };

  if (!isOpen) return null;

  const currencySymbol = CURRENCIES[currency]?.symbol || '₹';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description.');
      return;
    }
    if (!category.trim()) {
      setError('Please select a category.');
      return;
    }

    const transaction: Transaction = {
      id: initialTransaction ? initialTransaction.id : generateID(),
      type,
      amount: Math.round(numAmount * 100) / 100,
      category: category.trim(),
      date: date || getTodayDateString(),
      description: description.trim(),
      payment: type === 'expense' ? payment : undefined,
      notes: notes.trim() || undefined,
      createdAt: initialTransaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    onSave(transaction);
    onClose();
  };

  const categories = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;
  const quickAmounts = currency === 'INR' ? [100, 250, 500, 1000, 2500, 5000] : [5, 10, 20, 50, 100, 250];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-cyan-500/30 w-full max-w-lg overflow-hidden glow-cyan relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {initialTransaction ? '// EDIT_TRANSACTION' : '// DISPATCH_TRANSACTION'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sync financial telemetry with local ledger
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-mono">
              {error}
            </div>
          )}

          {/* Type Selector (Segmented control) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-bold rounded-xl transition-all font-mono ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              - OUTFLOW DEBIT
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-bold rounded-xl transition-all font-mono ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              + INFLOW CREDIT
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              AMOUNT ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold font-mono text-cyan-500">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xl font-mono font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
              />
            </div>
            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors tabular-nums"
                >
                  +{currencySymbol}{q}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              DESCRIPTION
            </label>
            <input
              type="text"
              placeholder={type === 'expense' ? 'e.g., Blinkit Groceries, Metro Smart Pass' : 'e.g., Monthly Corporate Salary'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
            />
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                TIMESTAMP
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                PAYMENT CHANNEL
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_METHODS.slice(0, 4).map((pm) => (
                  <button
                    type="button"
                    key={pm}
                    onClick={() => setPayment(pm as PaymentMethod)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all font-mono ${
                      payment === pm
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:border-cyan-400 dark:text-cyan-300 glow-cyan'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              METADATA / TAGS
            </label>
            <input
              type="text"
              placeholder="e.g., Work trip, Reimbursement pending, Client Dinner"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl transition-colors font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-xs font-bold font-mono text-white rounded-xl shadow-lg flex items-center gap-1.5 transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-500 active:scale-98 glow-rose'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 glow-emerald'
              }`}
            >
              {initialTransaction ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {initialTransaction ? 'SAVE MODIFICATIONS' : type === 'expense' ? 'COMMIT DEBIT' : 'COMMIT CREDIT'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
