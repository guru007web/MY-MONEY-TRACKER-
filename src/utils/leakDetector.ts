import { Transaction, MoneyLeakItem, CurrencyCode } from '../types/finance';
import { formatCurrency } from './storage';

export interface LeakAnalysisResult {
  totalSpending: number;
  totalIncome: number;
  savingsRate: number;
  spendingHealthScore: number; // 0 - 100
  scoreLabel: string;
  leaks: MoneyLeakItem[];
  topCategories: { category: string; amount: number; percentage: number }[];
  microSpendSummary: {
    count: number;
    totalAmount: number;
    monthlyProjected: number;
    sampleDescriptions: string[];
  };
  weekendVsWeekday: {
    weekendAvgPerDay: number;
    weekdayAvgPerDay: number;
    weekendRatio: number; // e.g. 2.1x
  };
  needsVsWants: {
    needsAmount: number;
    needsPercentage: number;
    wantsAmount: number;
    wantsPercentage: number;
    savingsAmount: number;
    savingsPercentage: number;
  };
}

const NEEDS_CATEGORIES = new Set([
  'Rent & Housing',
  'Bills & Utilities',
  'Groceries',
  'Health & Medical',
  'Education',
  'Insurance',
]);

const WANTS_CATEGORIES = new Set([
  'Food & Dining',
  'Shopping',
  'Entertainment',
  'Subscriptions',
  'Travel & Commute',
  'Other',
]);

export function analyzeMoneyLeaks(
  expenses: Transaction[],
  incomes: Transaction[],
  currency: CurrencyCode = 'INR'
): LeakAnalysisResult {
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalIncome = incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netBalance / totalIncome) * 100) : 0;

  // 1. Category aggregation
  const catTotals: Record<string, { amount: number; count: number }> = {};
  expenses.forEach((e) => {
    const cat = e.category || 'Other';
    if (!catTotals[cat]) catTotals[cat] = { amount: 0, count: 0 };
    catTotals[cat].amount += Number(e.amount) || 0;
    catTotals[cat].count += 1;
  });

  const sortedCategories = Object.entries(catTotals)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 2. Micro-spend detection (transactions <= 250 in INR or <= 5 in USD)
  const microThreshold = currency === 'INR' ? 300 : 10;
  const microSpends = expenses.filter((e) => Number(e.amount) > 0 && Number(e.amount) <= microThreshold);
  const microTotal = microSpends.reduce((sum, e) => sum + Number(e.amount), 0);
  const microDescriptions = Array.from(new Set(microSpends.map((e) => e.description))).slice(0, 5);

  // 3. Weekend vs Weekday analysis
  let weekendSum = 0;
  let weekendDaysCount = 0;
  let weekdaySum = 0;
  let weekdayDaysCount = 0;

  const weekendDays = new Set([0, 6]); // Sunday = 0, Saturday = 6
  const dateMap: Record<string, number> = {};

  expenses.forEach((e) => {
    if (!e.date) return;
    dateMap[e.date] = (dateMap[e.date] || 0) + Number(e.amount);
  });

  Object.entries(dateMap).forEach(([dateStr, dayTotal]) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const dayOfWeek = d.getDay();
        if (weekendDays.has(dayOfWeek)) {
          weekendSum += dayTotal;
          weekendDaysCount++;
        } else {
          weekdaySum += dayTotal;
          weekdayDaysCount++;
        }
      }
    } catch {
      // ignore
    }
  });

  const weekendAvg = weekendDaysCount > 0 ? weekendSum / weekendDaysCount : 0;
  const weekdayAvg = weekdayDaysCount > 0 ? weekdaySum / weekdayDaysCount : 0;
  const weekendRatio = weekdayAvg > 0 ? Math.round((weekendAvg / weekdayAvg) * 10) / 10 : 1;

  // 4. Needs vs Wants (50/30/20)
  let needsAmount = 0;
  let wantsAmount = 0;

  expenses.forEach((e) => {
    const amt = Number(e.amount) || 0;
    if (NEEDS_CATEGORIES.has(e.category)) {
      needsAmount += amt;
    } else {
      wantsAmount += amt;
    }
  });

  const baseForRatio = totalIncome > 0 ? totalIncome : totalExpenses;
  const needsPercentage = baseForRatio > 0 ? (needsAmount / baseForRatio) * 100 : 0;
  const wantsPercentage = baseForRatio > 0 ? (wantsAmount / baseForRatio) * 100 : 0;
  const savingsAmount = Math.max(0, netBalance);
  const savingsPercentage = baseForRatio > 0 ? (savingsAmount / baseForRatio) * 100 : 0;

  // 5. Generate Leak Items
  const leaks: MoneyLeakItem[] = [];

  // A. Top Spending Category Leak
  if (sortedCategories.length > 0) {
    const top = sortedCategories[0];
    if (top.percentage > 30) {
      leaks.push({
        id: 'leak-top-drain',
        title: `Heavy Drain in ${top.category}`,
        category: top.category,
        severity: top.percentage > 45 ? 'high' : 'medium',
        type: 'top_drain',
        monthlyImpact: top.amount,
        yearlyImpact: top.amount * 12,
        transactionCount: top.count,
        description: `${top.category} is currently eating up ${top.percentage.toFixed(1)}% of your total spending (${formatCurrency(top.amount, currency)}).`,
        recommendation: `Aim to cap ${top.category} spending at ${Math.round(top.percentage * 0.75)}% by planning purchases in advance or setting a strict weekly category envelope.`,
        potentialSavingsPercentage: 25,
      });
    }
  }

  // B. Micro-Transactions Leak ("Death by a Thousand Cuts")
  if (microSpends.length >= 4 && microTotal > 0) {
    const projectedAnnual = microTotal * 12;
    leaks.push({
      id: 'leak-micro-spends',
      title: 'Micro-Transaction Leak ("Phantom Spending")',
      category: 'Food & Dining',
      severity: microSpends.length > 10 ? 'high' : 'medium',
      type: 'micro_spend',
      monthlyImpact: microTotal,
      yearlyImpact: projectedAnnual,
      transactionCount: microSpends.length,
      description: `You logged ${microSpends.length} small payments (under ${formatCurrency(microThreshold, currency)}) totaling ${formatCurrency(microTotal, currency)} (${microDescriptions.join(', ')}). These small impulse buys quietly drain balances.`,
      recommendation: `Try a "No-Spend Weekday" challenge or allocate a set cash/UPI pocket wallet for impulsive quick snacks and coffees.`,
      potentialSavingsPercentage: 40,
    });
  }

  // C. Subscriptions & Recurring Creep
  const subCategory = sortedCategories.find((c) => c.category === 'Subscriptions');
  if (subCategory && subCategory.amount > 0) {
    leaks.push({
      id: 'leak-subscriptions',
      title: 'Recurring Subscription Creep',
      category: 'Subscriptions',
      severity: subCategory.amount > (currency === 'INR' ? 1500 : 40) ? 'medium' : 'low',
      type: 'subscription_creep',
      monthlyImpact: subCategory.amount,
      yearlyImpact: subCategory.amount * 12,
      transactionCount: subCategory.count,
      description: `You are spending ${formatCurrency(subCategory.amount, currency)} monthly across recurring services (${formatCurrency(subCategory.amount * 12, currency)} yearly).`,
      recommendation: `Audit your active streaming, app, and gym memberships. Pause or cancel 1-2 services you haven't used this month.`,
      potentialSavingsPercentage: 35,
    });
  }

  // D. Weekend Spending Surge
  if (weekendRatio >= 1.7 && weekendAvg > 0) {
    const extraWeekendSpend = Math.max(0, (weekendAvg - weekdayAvg) * weekendDaysCount);
    leaks.push({
      id: 'leak-weekend-surge',
      title: 'Weekend Impulse Spike',
      category: 'Entertainment',
      severity: weekendRatio > 2.5 ? 'high' : 'medium',
      type: 'weekend_surge',
      monthlyImpact: extraWeekendSpend * 4,
      yearlyImpact: extraWeekendSpend * 4 * 12,
      description: `You spend ${weekendRatio}x more per day on weekends compared to regular weekdays (avg ${formatCurrency(weekendAvg, currency)}/weekend day vs ${formatCurrency(weekdayAvg, currency)}/weekday).`,
      recommendation: `Set a fixed weekend entertainment cap on Friday afternoon. Once the weekend envelope is empty, switch to free outdoor activities.`,
      potentialSavingsPercentage: 30,
    });
  }

  // E. Wants Over Budget (50/30/20 Rule Violation)
  if (wantsPercentage > 35) {
    const excessWants = (wantsAmount * (wantsPercentage - 30)) / wantsPercentage;
    leaks.push({
      id: 'leak-wants-ratio',
      title: 'Discretionary "Wants" Exceeding Safe Limit',
      category: 'Shopping',
      severity: wantsPercentage > 50 ? 'high' : 'medium',
      type: 'budget_breach',
      monthlyImpact: excessWants,
      yearlyImpact: excessWants * 12,
      description: `Discretionary spending (Dining out, shopping, entertainment) is ${wantsPercentage.toFixed(1)}% of your budget, exceeding the recommended 30% guideline.`,
      recommendation: `Implement a 48-hour delay rule on non-essential online purchases over ${formatCurrency(currency === 'INR' ? 1000 : 30, currency)}.`,
      potentialSavingsPercentage: 20,
    });
  }

  // 6. Calculate Financial Health Score (0 - 100)
  let healthScore = 70;
  if (totalExpenses === 0 && totalIncome === 0) {
    healthScore = 50;
  } else {
    // Reward savings rate: +20 points max
    healthScore += Math.min(25, (savingsRate / 30) * 25);
    // Penalize overspending:
    if (netBalance < 0) healthScore -= 30;
    // Penalize high severity leaks:
    const highLeaks = leaks.filter((l) => l.severity === 'high').length;
    const medLeaks = leaks.filter((l) => l.severity === 'medium').length;
    healthScore -= highLeaks * 12;
    healthScore -= medLeaks * 5;
    // Clamp to 10 - 98
    healthScore = Math.max(15, Math.min(96, Math.round(healthScore)));
  }

  let scoreLabel = 'Fair';
  if (healthScore >= 80) scoreLabel = 'Healthy';
  else if (healthScore >= 65) scoreLabel = 'Moderate';
  else if (healthScore >= 50) scoreLabel = 'Leaky';
  else scoreLabel = 'High Leak Risk';

  return {
    totalSpending: totalExpenses,
    totalIncome,
    savingsRate,
    spendingHealthScore: healthScore,
    scoreLabel,
    leaks,
    topCategories: sortedCategories,
    microSpendSummary: {
      count: microSpends.length,
      totalAmount: microTotal,
      monthlyProjected: microTotal,
      sampleDescriptions: microDescriptions,
    },
    weekendVsWeekday: {
      weekendAvgPerDay: Math.round(weekendAvg),
      weekdayAvgPerDay: Math.round(weekdayAvg),
      weekendRatio,
    },
    needsVsWants: {
      needsAmount,
      needsPercentage,
      wantsAmount,
      wantsPercentage,
      savingsAmount,
      savingsPercentage,
    },
  };
}
