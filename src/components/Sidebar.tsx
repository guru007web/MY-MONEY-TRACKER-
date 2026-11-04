import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  PieChart,
  SearchCheck,
  Target,
  Sun,
  Moon,
  Coins,
  Sparkles,
  Radio,
  Cpu,
} from 'lucide-react';
import { CurrencyCode } from '../types/finance';
import { CURRENCIES } from '../utils/storage';

export type ActiveTab = 'dashboard' | 'expenses' | 'income' | 'analytics' | 'leaks' | 'budgets';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currency: CurrencyCode;
  setCurrency: (cur: CurrencyCode) => void;
  onOpenQuickAdd: (type: 'expense' | 'income') => void;
  onLoadSampleData: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  currency,
  setCurrency,
  onOpenQuickAdd,
  onLoadSampleData,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Cockpit Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'expenses',
      label: 'Expense Ledger',
      icon: <ArrowDownCircle className="w-4 h-4 shrink-0 text-rose-400" />,
    },
    {
      id: 'income',
      label: 'Income Credits',
      icon: <ArrowUpCircle className="w-4 h-4 shrink-0 text-emerald-400" />,
    },
    {
      id: 'analytics',
      label: 'Spectral Analytics',
      icon: <PieChart className="w-4 h-4 shrink-0 text-cyan-400" />,
    },
    {
      id: 'leaks',
      label: 'Money Leak Detector',
      icon: <SearchCheck className="w-4 h-4 shrink-0 text-amber-400" />,
      badge: 'Radar',
    },
    {
      id: 'budgets',
      label: 'Budgets & Goals',
      icon: <Target className="w-4 h-4 shrink-0 text-indigo-400" />,
    },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-slate-100 flex flex-col justify-between p-4 border-r border-slate-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Futuristic Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-3 border-b border-slate-800/80 pb-4">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg glow-cyan shrink-0 border border-cyan-400/40">
              <span className="text-white text-base font-black font-mono">₹/</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-white tracking-tight truncate font-mono">
                  MONEY RADAR
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest truncate">
                AI LEAK DETECTOR
              </p>
            </div>
          </div>

          {/* Quick Action Buttons with futuristic glow */}
          <div className="grid grid-cols-2 gap-2 mb-5 px-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenQuickAdd('expense')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-semibold font-mono transition-all"
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>- Debit</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenQuickAdd('income')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-semibold font-mono transition-all"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>+ Credit</span>
            </motion.button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 text-cyan-300 border border-cyan-500/40 glow-cyan shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full" />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2 mt-auto shrink-0">
          {/* Currency Switcher */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <Coins className="w-3.5 h-3.5 text-cyan-400" />
              <span>Unit</span>
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="bg-transparent text-cyan-300 font-bold text-xs border-0 outline-none cursor-pointer focus:ring-0 text-right pr-1"
            >
              {Object.keys(CURRENCIES).map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {CURRENCIES[c as CurrencyCode].symbol} ({c})
                </option>
              ))}
            </select>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium transition-colors font-mono"
          >
            <div className="flex items-center gap-2">
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{darkMode ? 'Solar Mode' : 'Cyber Dark'}</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {darkMode ? '☀️' : '🌙'}
            </span>
          </button>

          {/* Sample Demo Data Button */}
          <button
            onClick={onLoadSampleData}
            title="Load demo transactions to test charts and leak detector"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-800/40 text-[11px] font-mono transition-colors"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Load Demo Data</span>
          </button>
        </div>
      </aside>
    </>
  );
};
