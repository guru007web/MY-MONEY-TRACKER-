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

  // 2. Micro-spend detection (transactions <= 250 in INR or <= 8 in USD)
  const microThreshold = currency === 'INR' ? 250 : 8;
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

  // 4. Needs vs Wants (Essentials vs Fun/Discretionary)
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

  // 5. Generate Leak Items with simple, friendly language
  const leaks: MoneyLeakItem[] = [];

  // A. Top Spending Category
  if (sortedCategories.length > 0) {
    const top = sortedCategories[0];
    if (top.percentage > 30) {
      leaks.push({
        id: 'leak-top-drain',
        title: `Big Spend on ${top.category}`,
        category: top.category,
        severity: top.percentage > 45 ? 'high' : 'medium',
        type: 'top_drain',
        monthlyImpact: top.amount,
        yearlyImpact: top.amount * 12,
        transactionCount: top.count,
        description: `You are spending ${top.percentage.toFixed(1)}% of your total money (${formatCurrency(top.amount, currency)}) on ${top.category}.`,
        recommendation: `Try setting a monthly spending limit for ${top.category} to keep more money in your pocket.`,
        potentialSavingsPercentage: 25,
      });
    }
  }

  // B. Small Daily Spends ("Chai, snacks, auto rides")
  if (microSpends.length >= 3 && microTotal > 0) {
    const projectedAnnual = microTotal * 12;
    leaks.push({
      id: 'leak-micro-spends',
      title: 'Small Daily Spends Adding Up',
      category: 'Food & Dining',
      severity: microSpends.length > 8 ? 'high' : 'medium',
      type: 'micro_spend',
      monthlyImpact: microTotal,
      yearlyImpact: projectedAnnual,
      transactionCount: microSpends.length,
      description: `You made ${microSpends.length} small payments (under ${formatCurrency(microThreshold, currency)}) like ${microDescriptions.join(', ')}. Together, they add up to ${formatCurrency(microTotal, currency)} without you noticing!`,
      recommendation: `Try keeping a small cash amount or separate wallet for daily tea, snacks, and quick rides instead of scanning UPI every time.`,
      potentialSavingsPercentage: 40,
    });
  }

  // C. Monthly Subscriptions
  const subCategory = sortedCategories.find((c) => c.category === 'Subscriptions');
  if (subCategory && subCategory.amount > 0) {
    leaks.push({
      id: 'leak-subscriptions',
      title: 'Monthly Subscriptions & Memberships',
      category: 'Subscriptions',
      severity: subCategory.amount > (currency === 'INR' ? 1200 : 35) ? 'medium' : 'low',
      type: 'subscription_creep',
      monthlyImpact: subCategory.amount,
      yearlyImpact: subCategory.amount * 12,
      transactionCount: subCategory.count,
      description: `You pay ${formatCurrency(subCategory.amount, currency)} each month for apps, streaming, or memberships (${formatCurrency(subCategory.amount * 12, currency)} a year).`,
      recommendation: `Check your phone's subscriptions and cancel any apps, OTT platforms, or gym memberships you don't use often.`,
      potentialSavingsPercentage: 35,
    });
  }

  // D. Weekend Spending Spikes
  if (weekendRatio >= 1.6 && weekendAvg > 0) {
    const extraWeekendSpend = Math.max(0, (weekendAvg - weekdayAvg) * weekendDaysCount);
    leaks.push({
      id: 'leak-weekend-surge',
      title: 'Higher Weekend Spending',
      category: 'Entertainment',
      severity: weekendRatio > 2.2 ? 'high' : 'medium',
      type: 'weekend_surge',
      monthlyImpact: extraWeekendSpend * 4,
      yearlyImpact: extraWeekendSpend * 4 * 12,
      description: `You spend about ${weekendRatio} times more on Saturdays and Sundays (avg ${formatCurrency(weekendAvg, currency)} per weekend day vs ${formatCurrency(weekdayAvg, currency)} on weekdays).`,
      recommendation: `Decide a friendly weekend budget before Friday evening so you can enjoy without overspending.`,
      potentialSavingsPercentage: 30,
    });
  }

  // E. Wants Over Safe Target
  if (wantsPercentage > 35) {
    const excessWants = (wantsAmount * (wantsPercentage - 30)) / wantsPercentage;
    leaks.push({
      id: 'leak-wants-ratio',
      title: 'Spending on Wants is High',
      category: 'Shopping',
      severity: wantsPercentage > 50 ? 'high' : 'medium',
      type: 'budget_breach',
      monthlyImpact: excessWants,
      yearlyImpact: excessWants * 12,
      description: `Non-essential spending (eating out, shopping, movies) is taking up ${wantsPercentage.toFixed(1)}% of your money. Aiming for around 30% helps you save comfortably.`,
      recommendation: `Wait a day or two before buying online clothes, shoes, or gadgets to avoid impulse buys.`,
      potentialSavingsPercentage: 20,
    });
  }

  // 6. Calculate Financial Health Score (0 - 100)
  let healthScore = 70;
  if (totalExpenses === 0 && totalIncome === 0) {
    healthScore = 50;
  } else {
    healthScore += Math.min(25, (savingsRate / 30) * 25);
    if (netBalance < 0) healthScore -= 30;
    const highLeaks = leaks.filter((l) => l.severity === 'high').length;
    const medLeaks = leaks.filter((l) => l.severity === 'medium').length;
    healthScore -= highLeaks * 12;
    healthScore -= medLeaks * 5;
    healthScore = Math.max(15, Math.min(96, Math.round(healthScore)));
  }

  let scoreLabel = 'Fair';
  if (healthScore >= 80) scoreLabel = 'Great Savings!';
  else if (healthScore >= 65) scoreLabel = 'Doing Okay';
  else if (healthScore >= 50) scoreLabel = 'A Few Leaks Found';
  else scoreLabel = 'Needs Attention';

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
