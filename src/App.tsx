import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Transaction,
  CategoryBudget,
  SavingsGoal,
  CurrencyCode,
} from './types/finance';
import {
  loadExpenses,
  saveExpenses,
  loadIncomes,
  saveIncomes,
  loadBudgets,
  saveBudgets,
  loadGoals,
  saveGoals,
  loadCurrency,
  saveCurrency,
  getSampleDataset,
} from './utils/storage';
import { analyzeMoneyLeaks } from './utils/leakDetector';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { IncomeView } from './components/IncomeView';
import { AnalyticsView } from './components/AnalyticsView';
import { MoneyLeakView } from './components/MoneyLeakView';
import { BudgetsGoalsView } from './components/BudgetsGoalsView';
import { TransactionModal } from './components/TransactionModal';
import { Menu, Plus, CheckCircle2, Radio, Activity } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [income, setIncome] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');
  const [darkMode, setDarkModeState] = useState<boolean>(true); // default to futuristic dark mode
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultModalType, setDefaultModalType] = useState<'expense' | 'income'>('expense');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. Initial Load
  useEffect(() => {
    const loadedExp = loadExpenses();
    const loadedInc = loadIncomes();
    const loadedBgt = loadBudgets();
    const loadedGls = loadGoals();
    const loadedCur = loadCurrency();

    let initialDark = true;
    try {
      const savedDark = localStorage.getItem('darkMode');
      initialDark = savedDark !== null ? savedDark === 'enabled' : true;
    } catch {
      initialDark = true;
    }

    if (loadedExp.length === 0 && loadedInc.length === 0) {
      const sample = getSampleDataset();
      setExpenses(sample.expenses);
      setIncome(sample.income);
      saveExpenses(sample.expenses);
      saveIncomes(sample.income);
    } else {
      setExpenses(loadedExp);
      setIncome(loadedInc);
    }

    setBudgets(loadedBgt);
    setGoals(loadedGls);
    setCurrencyState(loadedCur);
    setDarkModeState(initialDark);

    if (initialDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, []);

  // 2. Sync Dark Mode
  const handleToggleDarkMode = (val: boolean) => {
    setDarkModeState(val);
    try {
      localStorage.setItem('darkMode', val ? 'enabled' : 'disabled');
    } catch {
      // ignore
    }
    if (val) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  };

  // 3. Sync Currency
  const handleSetCurrency = (cur: CurrencyCode) => {
    setCurrencyState(cur);
    saveCurrency(cur);
    showToast(`Currency unit switched to ${cur}`);
  };

  // 4. Save updates
  const handleSaveTransaction = (transaction: Transaction) => {
    if (transaction.type === 'expense') {
      const exists = expenses.some((e) => e.id === transaction.id);
      let updated: Transaction[];
      if (exists) {
        updated = expenses.map((e) => (e.id === transaction.id ? transaction : e));
        showToast('Debit transaction updated');
      } else {
        updated = [transaction, ...expenses];
        showToast('Expense debit recorded');
      }
      setExpenses(updated);
      saveExpenses(updated);
    } else {
      const exists = income.some((i) => i.id === transaction.id);
      let updated: Transaction[];
      if (exists) {
        updated = income.map((i) => (i.id === transaction.id ? transaction : i));
        showToast('Credit transaction updated');
      } else {
        updated = [transaction, ...income];
        showToast('Income credit recorded');
      }
      setIncome(updated);
      saveIncomes(updated);
    }
  };

  const handleDeleteTransaction = (id: string, type: 'expense' | 'income') => {
    if (!confirm('Are you sure you want to remove this ledger entry?')) return;

    if (type === 'expense') {
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      saveExpenses(updated);
      showToast('Debit entry removed');
    } else {
      const updated = income.filter((i) => i.id !== id);
      setIncome(updated);
      saveIncomes(updated);
      showToast('Credit entry removed');
    }
  };

  const handleOpenAdd = (type: 'expense' | 'income') => {
    setDefaultModalType(type);
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setDefaultModalType(tx.type);
    setIsModalOpen(true);
  };

  // Load sample dataset
  const handleLoadSample = () => {
    if (
      expenses.length > 0 &&
      !confirm('Loading demo telemetry will merge realistic transactions. Proceed?')
    ) {
      return;
    }
    const sample = getSampleDataset();
    const newExpenses = [...sample.expenses, ...expenses];
    const newIncome = [...sample.income, ...income];
    setExpenses(newExpenses);
    setIncome(newIncome);
    saveExpenses(newExpenses);
    saveIncomes(newIncome);
    showToast('Telemetry demo data loaded!');
  };

  // JSON Restore
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON structure');
        }

        const restoredExpenses: Transaction[] = Array.isArray(parsed.expenses) ? parsed.expenses : [];
        const restoredIncome: Transaction[] = Array.isArray(parsed.income) ? parsed.income : [];
        const restoredBudgets: CategoryBudget[] = Array.isArray(parsed.budgets) ? parsed.budgets : budgets;
        const restoredGoals: SavingsGoal[] = Array.isArray(parsed.goals) ? parsed.goals : goals;

        setExpenses(restoredExpenses);
        setIncome(restoredIncome);
        setBudgets(restoredBudgets);
        setGoals(restoredGoals);

        saveExpenses(restoredExpenses);
        saveIncomes(restoredIncome);
        saveBudgets(restoredBudgets);
        saveGoals(restoredGoals);

        showToast('Archive restored successfully!');
      } catch (err) {
        console.error('Failed to restore backup:', err);
        alert('Could not parse the backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Run Leak Analysis for Dashboard Top Alert
  const analysis = analyzeMoneyLeaks(expenses, income, currency);
  const topLeak = analysis.leaks.length > 0 ? analysis.leaks[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 bg-cyber-grid">
      {/* Hidden File input for Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRestoreFile}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Futuristic Floating HUD Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/90 text-white text-xs font-mono font-semibold rounded-2xl shadow-2xl border border-cyan-500/40 glow-cyan backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={handleToggleDarkMode}
        currency={currency}
        setCurrency={handleSetCurrency}
        onOpenQuickAdd={handleOpenAdd}
        onLoadSampleData={handleLoadSample}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Header Bar following Top Bar Contract */}
        <header className="sticky top-0 z-30 h-16 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline font-bold text-slate-900 dark:text-slate-200">
                WHERE DOES MY MONEY GO?
              </span>
              <span className="hidden sm:inline text-slate-600" aria-hidden="true">/</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold uppercase tracking-wider">
                {activeTab === 'leaks' ? 'LEAK RADAR HUD' : activeTab.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenAdd('expense')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold shadow-md glow-cyan transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">+ LOG TRANSACTION</span>
            </motion.button>
          </div>
        </header>

        {/* Viewport Content with Animated Tab Transitions */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  expenses={expenses}
                  income={income}
                  budgets={budgets}
                  currency={currency}
                  onNavigate={setActiveTab}
                  onOpenAddModal={handleOpenAdd}
                  onEditTransaction={handleEdit}
                  onDeleteTransaction={handleDeleteTransaction}
                  topLeak={topLeak}
                  onRestoreClick={() => fileInputRef.current?.click()}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesView
                  expenses={expenses}
                  currency={currency}
                  onAddExpense={handleSaveTransaction}
                  onEditExpense={handleEdit}
                  onDeleteExpense={(id) => handleDeleteTransaction(id, 'expense')}
                />
              )}

              {activeTab === 'income' && (
                <IncomeView
                  income={income}
                  currency={currency}
                  onAddIncome={handleSaveTransaction}
                  onEditIncome={handleEdit}
                  onDeleteIncome={(id) => handleDeleteTransaction(id, 'income')}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  expenses={expenses}
                  income={income}
                  currency={currency}
                />
              )}

              {activeTab === 'leaks' && (
                <MoneyLeakView
                  expenses={expenses}
                  income={income}
                  currency={currency}
                />
              )}

              {activeTab === 'budgets' && (
                <BudgetsGoalsView
                  expenses={expenses}
                  budgets={budgets}
                  goals={goals}
                  currency={currency}
                  onSaveBudgets={(newBudgets) => {
                    setBudgets(newBudgets);
                    saveBudgets(newBudgets);
                    showToast('Category budgets updated');
                  }}
                  onSaveGoals={(newGoals) => {
                    setGoals(newGoals);
                    saveGoals(newGoals);
                    showToast('Savings goals updated');
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Futuristic Minimal Footer */}
        <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 text-center text-xs font-mono text-slate-400 dark:text-slate-500">
          <span>MONEY RADAR v2.4 // </span>
          <span className="text-cyan-500">QUANTUM FINANCE HUD</span>
          <span> // ALL DATA ENCRYPTED LOCALLY</span>
        </footer>
      </div>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        initialTransaction={editingTransaction}
        defaultType={defaultModalType}
        currency={currency}
      />
    </div>
  );
}
