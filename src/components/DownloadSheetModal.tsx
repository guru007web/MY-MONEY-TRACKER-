import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  WifiOff,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Transaction, CategoryBudget, CurrencyCode } from '../types/finance';
import { formatCurrency } from '../utils/storage';
import {
  exportExpensesToExcel,
  exportIncomeToExcel,
  exportCompleteWorkbookToExcel,
} from '../utils/excelExport';
import { exportExpensesCSV, exportIncomeCSV, exportAllCSV } from '../utils/storage';

interface DownloadSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Transaction[];
  income: Transaction[];
  budgets: CategoryBudget[];
  currency: CurrencyCode;
  onDownloaded?: (msg: string) => void;
}

export const DownloadSheetModal: React.FC<DownloadSheetModalProps> = ({
  isOpen,
  onClose,
  expenses,
  income,
  budgets,
  currency,
  onDownloaded,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalIncome = income.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const netSavings = totalIncome - totalExpense;

  const handleDownload = (action: () => boolean | void, successMessage: string) => {
    action();
    setDownloadSuccess(successMessage);
    if (onDownloaded) {
      onDownloaded(successMessage);
    }
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-emerald-500/30 w-full max-w-xl overflow-hidden relative glow-emerald"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Download Excel Sheet</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  OFFLINE READY
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Keep your records offline on your phone or PC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {downloadSuccess && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{downloadSuccess} Check your browser downloads folder!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Offline benefit callout banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/25 flex items-start gap-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900 dark:text-slate-100">
                Works 100% Offline (No Internet Required)
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Your spreadsheet is built right in your browser. Download it now to have your complete financial statement ready to open anytime in Microsoft Excel, Google Sheets, LibreOffice, or WPS Office without waiting for network connectivity.
              </p>
            </div>
          </div>

          {/* Quick Data Snapshot */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Expenses</span>
              <span className="text-sm font-bold text-rose-500 dark:text-rose-400 tabular-nums">
                {formatCurrency(totalExpense, currency)}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">{expenses.length} items</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Income</span>
              <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400 tabular-nums">
                {formatCurrency(totalIncome, currency)}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">{income.length} items</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Balance</span>
              <span className={`text-sm font-bold tabular-nums ${netSavings >= 0 ? 'text-cyan-500' : 'text-rose-400'}`}>
                {formatCurrency(netSavings, currency)}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">Net Left</span>
            </div>
          </div>

          {/* Download Options */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Choose Spreadsheet Format
            </h3>

            {/* Option 1: Complete Excel Workbook (Featured) */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.15 }}
              className="p-4 rounded-2xl border-2 border-emerald-500/50 dark:border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-md">
                  📊
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Complete Excel Workbook (.xlsx)
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Includes 4 organized sheets: <strong>Summary Overview</strong>, <strong>All Expenses</strong>, <strong>All Income</strong>, and <strong>Monthly Limits</strong>.
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  handleDownload(
                    () => exportCompleteWorkbookToExcel(expenses, income, budgets, currency),
                    'Complete Excel Workbook downloaded!'
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 shrink-0 transition-all glow-emerald"
              >
                <Download className="w-4 h-4" />
                <span>Download .XLSX</span>
              </motion.button>
            </motion.div>

            {/* Option 2: Expenses Only (.xlsx) */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Expenses Sheet Only (.xlsx)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Itemized list of all your expenses with category, date, and payment method columns.
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  handleDownload(
                    () => exportExpensesToExcel(expenses, currency),
                    'Expense sheet downloaded!'
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Expenses .XLSX</span>
              </motion.button>
            </div>

            {/* Option 3: Income Only (.xlsx) */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Income Sheet Only (.xlsx)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Clean record of your salary, allowances, and side earnings.
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  handleDownload(
                    () => exportIncomeToExcel(income, currency),
                    'Income sheet downloaded!'
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Income .XLSX</span>
              </motion.button>
            </div>

            {/* Option 4: Universal CSV format */}
            <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Looking for lightweight plain text?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleDownload(
                      () => exportExpensesCSV(expenses),
                      'Expenses CSV downloaded!'
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                >
                  Expenses CSV
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  onClick={() =>
                    handleDownload(
                      () => exportAllCSV(expenses, income),
                      'Combined CSV downloaded!'
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 rounded-lg transition-colors"
                >
                  All CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            100% Private — Stored strictly on your device
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-lg font-mono"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
