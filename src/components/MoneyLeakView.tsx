import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, CurrencyCode } from '../types/finance';
import { analyzeMoneyLeaks } from '../utils/leakDetector';
import { formatCurrency } from '../utils/storage';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Zap,
  Sliders,
  Coffee,
  Tv,
  Calendar,
  Layers,
  Crosshair,
  Radio,
  ArrowRight,
  Flame,
  HelpCircle,
} from 'lucide-react';

interface MoneyLeakViewProps {
  expenses: Transaction[];
  income: Transaction[];
  currency: CurrencyCode;
}

export const MoneyLeakView: React.FC<MoneyLeakViewProps> = ({
  expenses,
  income,
  currency,
}) => {
  // Simulator sliders
  const [cutDiningPercent, setCutDiningPercent] = useState<number>(25);
  const [cutMicroPercent, setCutMicroPercent] = useState<number>(40);
  const [cutWeekendPercent, setCutWeekendPercent] = useState<number>(20);
  const [cancelSubs, setCancelSubs] = useState<boolean>(true);

  // Selected radar target
  const [activeLeakId, setActiveLeakId] = useState<string | null>(null);

  // Checkable action habits
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const analysis = analyzeMoneyLeaks(expenses, income, currency);

  // Calculate dining expense amount
  const diningTotal = expenses
    .filter((e) => e.category === 'Food & Dining')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Subscriptions total
  const subsTotal = expenses
    .filter((e) => e.category === 'Subscriptions')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Simulation calculations
  const diningSaved = (diningTotal * cutDiningPercent) / 100;
  const microSaved = (analysis.microSpendSummary.totalAmount * cutMicroPercent) / 100;
  const weekendExtra = analysis.weekendVsWeekday.weekendAvgPerDay * 4;
  const weekendSaved = (weekendExtra * cutWeekendPercent) / 100;
  const subsSaved = cancelSubs ? Math.min(subsTotal, currency === 'INR' ? 650 : 15) : 0;

  const totalMonthlyPotentialSavings = Math.round(diningSaved + microSaved + weekendSaved + subsSaved);
  const totalYearlyPotentialSavings = totalMonthlyPotentialSavings * 12;

  // 5 Year compound interest at 10% annual return
  const monthlyRate = 0.10 / 12;
  const months = 60;
  const futureValue5Years = totalMonthlyPotentialSavings > 0
    ? Math.round(totalMonthlyPotentialSavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate))
    : 0;

  const toggleAction = (id: string) => {
    setCompletedActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Coordinates for radar blips based on leaks
  const radarBlips = analysis.leaks.map((leak, idx) => {
    const angle = (idx * (360 / Math.max(1, analysis.leaks.length)) + 45) * (Math.PI / 180);
    const dist = leak.severity === 'high' ? 82 : leak.severity === 'medium' ? 60 : 38;
    const x = 110 + Math.cos(angle) * dist;
    const y = 110 + Math.sin(angle) * dist;
    return { ...leak, x, y };
  });

  return (
    <div className="space-y-6">
      {/* Friendly Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-500" />
              <span>Leak Radar Active</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1.5 flex items-center gap-2">
            <span>Money Leak Detector</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover where your money is quietly disappearing — small daily snacks, unused subscriptions, or weekend splurges.
          </p>
        </div>

        {/* Live Leak Counter Badge */}
        <div className="flex items-center gap-2.5 p-2 bg-slate-900 text-white rounded-xl border border-cyan-500/30 shadow-md">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Crosshair className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div className="pr-2">
            <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-semibold">
              Leaks Found
            </span>
            <span className="text-sm font-bold">
              {analysis.leaks.length === 0 ? 'All Clear' : `${analysis.leaks.length} Things to Fix`}
            </span>
          </div>
        </div>
      </div>

      {/* Radar & Health Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* RADAR VISUAL (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-cyan-400 border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />

          {/* Radar Header */}
          <div className="w-full flex items-center justify-between text-xs text-cyan-400/80 mb-2 relative z-10 font-semibold">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>Spending Radar</span>
            </span>
            <span className="text-[11px] text-slate-400">Live Scanner</span>
          </div>

          {/* SVG Radar Visual */}
          <div className="relative w-56 h-56 my-2 shrink-0">
            <svg viewBox="0 0 220 220" className="w-full h-full">
              <circle cx="110" cy="110" r="100" fill="none" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.4" />
              <circle cx="110" cy="110" r="75" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.3" />
              <circle cx="110" cy="110" r="50" fill="none" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.3" />
              <circle cx="110" cy="110" r="25" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.3" />

              <line x1="10" y1="110" x2="210" y2="110" stroke="#06b6d4" strokeWidth="0.7" strokeOpacity="0.3" />
              <line x1="110" y1="10" x2="110" y2="210" stroke="#06b6d4" strokeWidth="0.7" strokeOpacity="0.3" />

              {/* Rotating Sweep Beam */}
              <g className="animate-radar-sweep">
                <defs>
                  <linearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 110 110 L 110 10 A 100 100 0 0 1 210 110 Z"
                  fill="url(#radarSweepGrad)"
                />
                <line x1="110" y1="110" x2="110" y2="10" stroke="#22d3ee" strokeWidth="1.5" />
              </g>

              {/* Center Dot */}
              <circle cx="110" cy="110" r="4" fill="#22d3ee" className="animate-ping" />
              <circle cx="110" cy="110" r="3" fill="#ffffff" />

              {/* Radar Blips */}
              {radarBlips.map((blip) => {
                const isSelected = activeLeakId === blip.id;
                const blipColor = blip.severity === 'high' ? '#f43f5e' : blip.severity === 'medium' ? '#fbbf24' : '#38bdf8';

                return (
                  <g
                    key={blip.id}
                    className="cursor-pointer group"
                    onClick={() => setActiveLeakId(isSelected ? null : blip.id)}
                  >
                    <circle
                      cx={blip.x}
                      cy={blip.y}
                      r="9"
                      fill="none"
                      stroke={blipColor}
                      strokeWidth="1.5"
                      className="animate-pulse-ring"
                    />
                    <circle
                      cx={blip.x}
                      cy={blip.y}
                      r={isSelected ? 5 : 3.5}
                      fill={blipColor}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Simple Radar Legend */}
          <div className="w-full flex items-center justify-around text-xs border-t border-cyan-500/20 pt-2.5 mt-1 font-medium">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Big Leak
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Medium Leak
            </span>
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Watch Out
            </span>
          </div>
        </div>

        {/* HEALTH METRICS & SCORE (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Your Financial Health
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Spending Score
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  How well you are managing your spending and saving money.
                </p>
              </div>

              {/* Big Score Tag */}
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-cyan-600 dark:text-cyan-400">
                  {analysis.spendingHealthScore}
                  <span className="text-base text-slate-400 font-normal">/100</span>
                </span>
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {analysis.scoreLabel}
                </span>
              </div>
            </div>

            {/* Glowing Metric Bar */}
            <div className="my-4">
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative p-0.5 border border-slate-200 dark:border-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.spendingHealthScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    analysis.spendingHealthScore >= 75
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                      : analysis.spendingHealthScore >= 55
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-rose-600 to-rose-500'
                  }`}
                />
              </div>
            </div>

            {/* 3 Metric Pods */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Small Daily Spends
                </span>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                  {formatCurrency(analysis.microSpendSummary.totalAmount, currency)}
                </p>
                <span className="text-[11px] text-slate-400">
                  {analysis.microSpendSummary.count} small buys
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Fun & Shopping Share
                </span>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                  {analysis.needsVsWants.wantsPercentage.toFixed(1)}%
                </p>
                <span className="text-[11px] text-slate-400">Ideal: Around 30%</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Weekend Spending
                </span>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                  {analysis.weekendVsWeekday.weekendRatio}x
                </p>
                <span className="text-[11px] text-slate-400">Compared to weekdays</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 50/30/20 Rule Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>The 50/30/20 Rule (A simple guide for your money)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              50% for Needs (Rent, groceries, bills) · 30% for Wants (Eating out, shopping) · 20% for Savings
            </p>
          </div>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-3.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex gap-0.5 p-0.5 border border-slate-200 dark:border-slate-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, analysis.needsVsWants.needsPercentage)}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-cyan-500 rounded-l-full"
            title={`Needs: ${analysis.needsVsWants.needsPercentage.toFixed(1)}%`}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, analysis.needsVsWants.wantsPercentage)}%` }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="h-full bg-rose-500"
            title={`Wants: ${analysis.needsVsWants.wantsPercentage.toFixed(1)}%`}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, analysis.needsVsWants.savingsPercentage)}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-full bg-emerald-500 rounded-r-full"
            title={`Savings: ${analysis.needsVsWants.savingsPercentage.toFixed(1)}%`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Essentials (Needs): {analysis.needsVsWants.needsPercentage.toFixed(1)}% ({formatCurrency(analysis.needsVsWants.needsAmount, currency)})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Fun & Lifestyle (Wants): {analysis.needsVsWants.wantsPercentage.toFixed(1)}% ({formatCurrency(analysis.needsVsWants.wantsAmount, currency)})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Saved in Pocket: {analysis.needsVsWants.savingsPercentage.toFixed(1)}% ({formatCurrency(analysis.needsVsWants.savingsAmount, currency)})
            </span>
          </div>
        </div>
      </div>

      {/* Identified Money Leaks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <span>Where Your Money is Slipping Away</span>
          </h2>
          <span className="text-xs text-slate-400">
            Click any card to highlight it on the radar
          </span>
        </div>

        {analysis.leaks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No Major Leaks Found!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              You are doing a great job managing your money. Keep adding your expenses to maintain this healthy habit!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.leaks.map((leak) => {
              const isSelected = activeLeakId === leak.id;
              const isHigh = leak.severity === 'high';

              return (
                <motion.div
                  key={leak.id}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setActiveLeakId(isSelected ? null : leak.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/20 shadow-lg ring-1 ring-cyan-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          isHigh
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isHigh ? '⚠️ Big Leak' : '⚡ Medium Leak'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {leak.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {leak.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {leak.description}
                    </p>
                  </div>

                  {/* Impact */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Monthly Cost:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatCurrency(leak.monthlyImpact, currency)} / month
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Yearly Cost:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(leak.yearlyImpact, currency)} / year
                      </span>
                    </div>

                    <div className="mt-2 p-2.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/50 dark:border-cyan-800/40 text-[11px] text-cyan-900 dark:text-cyan-200 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                      <span>{leak.recommendation}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Simple "What-If" Savings Calculator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-2xl border border-indigo-500/30 space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Simple Savings Calculator
              </h2>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Move the sliders below to see how much money you can easily save by making small everyday tweaks!
            </p>
          </div>
          <span className="text-xs px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full font-semibold border border-cyan-500/40">
            Interactive Calculator
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Sliders Column */}
          <div className="space-y-4">
            {/* Dining Slider */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-200 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  Cut Food Delivery & Eating Out by:
                </span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {cutDiningPercent}% (Save {formatCurrency(diningSaved, currency)}/mo)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={cutDiningPercent}
                onChange={(e) => setCutDiningPercent(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Micro-spend Slider */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Reduce Daily Snacks & Quick Chai by:
                </span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {cutMicroPercent}% (Save {formatCurrency(microSaved, currency)}/mo)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="10"
                value={cutMicroPercent}
                onChange={(e) => setCutMicroPercent(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Weekend Surge Slider */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Cut Weekend Extra Spending by:
                </span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {cutWeekendPercent}% (Save {formatCurrency(weekendSaved, currency)}/mo)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={cutWeekendPercent}
                onChange={(e) => setCutWeekendPercent(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Cancel Unused Subscriptions */}
            <label className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-xs cursor-pointer hover:bg-white/10 transition-colors backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-rose-400" />
                <span className="font-semibold text-slate-200">Cancel 1 unused app or streaming service</span>
              </div>
              <input
                type="checkbox"
                checked={cancelSubs}
                onChange={(e) => setCancelSubs(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Results Outcome Pod */}
          <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-cyan-400/30 space-y-5">
            <span className="text-xs uppercase tracking-wider text-cyan-300 font-bold block">
              💰 Money You Can Save
            </span>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-300">Extra Savings Every Month:</span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-cyan-300 tabular-nums tracking-tight">
                  +{formatCurrency(totalMonthlyPotentialSavings, currency)}
                  <span className="text-sm font-normal text-slate-300"> / month</span>
                </h3>
              </div>

              <div className="pt-3 border-t border-white/10">
                <span className="text-xs text-slate-300">Extra Savings in 1 Year:</span>
                <p className="text-xl font-bold text-white tabular-nums">
                  +{formatCurrency(totalYearlyPotentialSavings, currency)}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10">
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  What This Can Grow to in 5 Years (with 10% interest):
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums mt-0.5">
                  {formatCurrency(futureValue5Years, currency)}
                </p>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  💡 By simply making these small everyday adjustments, you can easily save over{' '}
                  <span className="text-cyan-300 font-bold">
                    {formatCurrency(futureValue5Years, currency)}
                  </span>{' '}
                  to buy a new vehicle, go on family vacations, or build an emergency fund!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Practical Action Habits Checklist */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>Easy Habits to Stop Money Leaks</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simple steps anyone can try this week
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: 'act-1',
              title: 'Check App Subscriptions on Your Phone',
              desc: 'Open Google Play or Apple App Store and cancel any unused music, OTT, or gym apps.',
            },
            {
              id: 'act-2',
              title: 'Keep a Small Daily UPI / Cash Budget',
              desc: 'Set a daily budget for chai, snacks, and auto rides so you don’t overspend on small items.',
            },
            {
              id: 'act-3',
              title: 'Wait 24 Hours Before Online Shopping',
              desc: 'Keep items in your cart for 24 hours. If you still need them tomorrow, then buy them!',
            },
            {
              id: 'act-4',
              title: 'Try 1 or 2 "No-Spend" Days This Week',
              desc: 'Pack homemade lunch and snacks on Tuesdays or Thursdays to save extra pocket money.',
            },
          ].map((item) => {
            const isDone = completedActions[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleAction(item.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  isDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-500 line-through'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-cyan-500/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!isDone}
                  readOnly
                  className="mt-0.5 w-4 h-4 accent-cyan-500 rounded shrink-0 pointer-events-none"
                />
                <div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 no-underline">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
