import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CategoryBudget,
  SavingsGoal,
  Transaction,
  CurrencyCode,
} from '../types/finance';
import {
  formatCurrency,
  formatDate,
  DEFAULT_EXPENSE_CATEGORIES,
  generateID,
} from '../utils/storage';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  TrendingUp,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';

interface BudgetsGoalsViewProps {
  expenses: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  currency: CurrencyCode;
  onSaveBudgets: (budgets: CategoryBudget[]) => void;
  onSaveGoals: (goals: SavingsGoal[]) => void;
}

export const BudgetsGoalsView: React.FC<BudgetsGoalsViewProps> = ({
  expenses,
  budgets,
  goals,
  currency,
  onSaveBudgets,
  onSaveGoals,
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [budgetLimitInput, setBudgetLimitInput] = useState<string>('');

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');

  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthExpenses = expenses.filter((e) => e.date && e.date.startsWith(currentMonthKey));

  const categorySpentMap: Record<string, number> = {};
  currentMonthExpenses.forEach((e) => {
    const c = e.category || 'Other';
    categorySpentMap[c] = (categorySpentMap[c] || 0) + (Number(e.amount) || 0);
  });

  const handleEditBudget = (cat: string, currentLimit: number) => {
    setEditingCategory(cat);
    setBudgetLimitInput(String(currentLimit));
  };

  const handleSaveBudgetLimit = (cat: string) => {
    const val = parseFloat(budgetLimitInput);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const updated = [...budgets];
    const idx = updated.findIndex((b) => b.category === cat);
    if (idx >= 0) {
      updated[idx].monthlyLimit = val;
    } else {
      updated.push({ category: cat, monthlyLimit: val });
    }

    onSaveBudgets(updated);
    setEditingCategory(null);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTargetAmount);
    const current = parseFloat(goalCurrentAmount) || 0;
    if (!goalTitle.trim() || isNaN(target) || target <= 0) {
      alert('Please provide a goal title and target amount.');
      return;
    }

    const newGoal: SavingsGoal = {
      id: generateID(),
      title: goalTitle.trim(),
      targetAmount: target,
      currentAmount: current,
      targetDate: goalTargetDate || undefined,
    };

    onSaveGoals([...goals, newGoal]);
    setGoalTitle('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('');
    setGoalTargetDate('');
    setIsGoalModalOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('Are you sure you want to delete this savings goal?')) {
      onSaveGoals(goals.filter((g) => g.id !== id));
    }
  };

  const handleDepositToGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!depositGoalId || isNaN(amt) || amt <= 0) return;

    const updated = goals.map((g) => {
      if (g.id === depositGoalId) {
        return { ...g, currentAmount: g.currentAmount + amt };
      }
      return g;
    });

    onSaveGoals(updated);
    setDepositGoalId(null);
    setDepositAmount('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              TARGET PROTOCOL // CEILINGS & MILESTONES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Budget Envelopes & Target Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Hard spending ceilings to suppress leaks and autonomous capital milestone accumulators.
          </p>
        </div>
      </div>

      {/* SECTION 1: Category Budget Envelopes */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-500" />
              <span>Active Monthly Spending Caps (Current Cycle)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Live consumption against allocated envelope ceilings
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-3 py-1 rounded-xl">
            CYCLE: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_EXPENSE_CATEGORIES.map((cat) => {
            const budgetItem = budgets.find((b) => b.category === cat);
            const limit = budgetItem ? budgetItem.monthlyLimit : 0;
            const spent = categorySpentMap[cat] || 0;
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
            const isOverBudget = limit > 0 && spent > limit;
            const isWarning = limit > 0 && !isOverBudget && percentage >= 80;

            const isEditing = editingCategory === cat;

            return (
              <motion.div
                key={cat}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.15 }}
                className={`p-4 rounded-xl border transition-all ${
                  isOverBudget
                    ? 'border-rose-400 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 glow-rose'
                    : isWarning
                    ? 'border-amber-400 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
                    {cat}
                  </span>
                  {isOverBudget ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-1 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" /> EXCEEDED
                    </span>
                  ) : isWarning ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      80% CONSUMED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">
                      {limit > 0 ? `${percentage.toFixed(0)}% consumed` : 'No cap defined'}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {limit > 0 ? (
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2.5 p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percentage)}%` }}
                      transition={{ duration: 0.6 }}
                      className={`h-full rounded-full ${
                        isOverBudget ? 'bg-rose-500 glow-rose' : isWarning ? 'bg-amber-500' : 'bg-cyan-500 glow-cyan'
                      }`}
                    />
                  </div>
                ) : (
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mb-2.5" />
                )}

                {/* Spent vs Limit numbers */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-700/50 font-mono">
                  <div className="tabular-nums">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Consumed: </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(spent, currency)}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={budgetLimitInput}
                        onChange={(e) => setBudgetLimitInput(e.target.value)}
                        placeholder="Limit"
                        className="w-20 px-2 py-0.5 text-xs bg-white dark:bg-slate-900 border border-cyan-500 rounded font-semibold text-slate-900 dark:text-slate-100"
                      />
                      <button
                        onClick={() => handleSaveBudgetLimit(cat)}
                        className="px-2 py-0.5 bg-cyan-600 text-white rounded text-[11px] font-semibold"
                      >
                        Set
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Cap: {limit > 0 ? formatCurrency(limit, currency) : 'None'}
                      </span>
                      <button
                        onClick={() => handleEditBudget(cat, limit)}
                        className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Set or update budget cap"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Savings Goals Tracker */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" />
              <span>Target Savings Accumulators</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Autonomous capital milestones for emergency backup, travel, and investments
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-mono font-bold shadow-md glow-emerald transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ INITIALIZE GOAL</span>
          </motion.button>
        </div>

        {goals.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">
            <Coins className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-mono">No target goals initialized yet. Click above to define your first milestone!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {goals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

              return (
                <motion.div
                  key={goal.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between space-y-4 shadow-xs relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {goal.title}
                      </h3>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-emerald-500">
                          {pct}% REACHED
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          TARGET: {formatCurrency(goal.targetAmount, currency)}
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full glow-emerald"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 tabular-nums font-mono">
                      <span className="text-slate-500 dark:text-slate-400">Accumulated:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(goal.currentAmount, currency)}
                      </span>
                    </div>

                    {remaining > 0 ? (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {formatCurrency(remaining, currency)} remaining to complete.
                      </p>
                    ) : (
                      <p className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> TARGET ACHIEVED! 🚀
                      </p>
                    )}
                  </div>

                  {/* Deposit button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDepositGoalId(goal.id)}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Deposit Capital</span>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Create New Goal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-cyan-500/30 w-full max-w-md p-6 space-y-4 glow-cyan"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
              // INITIALIZE SAVINGS ACCUMULATOR
            </h3>
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GOAL TITLE
                </label>
                <input
                  type="text"
                  placeholder="e.g., Goa Vacation, Tech Upgrade, Emergency Reserve"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  TARGET CAPITAL ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  placeholder="50000"
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ALREADY DEPOSITED (OPTIONAL)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={goalCurrentAmount}
                  onChange={(e) => setGoalCurrentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  TARGET HORIZON DATE (OPTIONAL)
                </label>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-xl shadow-md glow-emerald"
                >
                  INITIALIZE
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Deposit Funds */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-cyan-500/30 w-full max-w-sm p-6 space-y-4 glow-cyan"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
              // DEPOSIT CAPITAL
            </h3>
            <form onSubmit={handleDepositToGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  AMOUNT ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  step="50"
                  autoFocus
                  placeholder="e.g. 2500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold text-base"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold rounded-xl shadow-md glow-cyan"
                >
                  CONFIRM DEPOSIT
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
