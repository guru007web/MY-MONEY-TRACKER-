import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Trash2,
  X,
  Download,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface DeleteAllDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  expensesCount: number;
  incomeCount: number;
  budgetsCount: number;
  goalsCount: number;
  onDownloadBackup: () => void;
}

export const DeleteAllDataModal: React.FC<DeleteAllDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  expensesCount,
  incomeCount,
  budgetsCount,
  goalsCount,
  onDownloadBackup,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const totalItems = expensesCount + incomeCount + budgetsCount + goalsCount;

  if (!isOpen) return null;

  const handleDelete = () => {
    onConfirmDelete();
    onClose();
    setConfirmText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-300 dark:border-rose-900/60 w-full max-w-md overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Delete All Data?
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Permanent action — Cannot be undone
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This will permanently delete all records saved on this device. The app will be completely empty and reset to zero.
          </p>

          {/* Records Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
              Data that will be removed:
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span>Expenses</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {expensesCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span>Income</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {incomeCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span>Budget Limits</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {budgetsCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span>Savings Goals</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {goalsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Backup prompt before deletion */}
          {totalItems > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between gap-3 text-xs">
              <span className="text-amber-800 dark:text-amber-300 text-[11px]">
                Want to keep a copy just in case?
              </span>
              <button
                type="button"
                onClick={onDownloadBackup}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Save Backup</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete Everything</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
