import React, { useState } from 'react';
import { formatCurrency } from '../../utils/storage';
import { CurrencyCode } from '../../types/finance';

interface TrendPoint {
  dateLabel: string;
  income: number;
  expenses: number;
  netSavings: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  currency?: CurrencyCode;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, currency = 'INR' }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 min-h-[220px]">
        <span className="text-3xl mb-2">📈</span>
        <p className="text-sm">Not enough data to calculate financial trend</p>
      </div>
    );
  }

  const width = 600;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const allValues = data.flatMap((d) => [d.income, d.expenses, d.netSavings]);
  const maxVal = Math.max(100, ...allValues);
  const minVal = Math.min(0, ...allValues);
  const range = maxVal - minVal || 1;

  const getX = (index: number) => {
    if (data.length === 1) return paddingX + chartWidth / 2;
    return paddingX + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingY + chartHeight - ((val - minVal) / range) * chartHeight;
  };

  // Generate SVG paths
  const incomePoints = data.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ');
  const expensePoints = data.map((d, i) => `${getX(i)},${getY(d.expenses)}`).join(' ');
  const savingsPoints = data.map((d, i) => `${getX(i)},${getY(d.netSavings)}`).join(' ');

  // Zero axis
  const zeroY = getY(0);

  return (
    <div className="w-full space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-end gap-5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-rose-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Expenses</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-indigo-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Net Savings</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 select-none overflow-visible">
          {/* Zero baseline */}
          <line
            x1={paddingX}
            y1={zeroY}
            x2={width - paddingX}
            y2={zeroY}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* Lines */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={incomePoints}
          />
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={expensePoints}
          />
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeDasharray="3 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={savingsPoints}
          />

          {/* Interactive dots */}
          {data.map((d, i) => {
            const x = getX(i);
            const isSelected = activeIdx === i;

            return (
              <g key={d.dateLabel} className="cursor-pointer" onMouseEnter={() => setActiveIdx(i)}>
                {isSelected && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="text-slate-400 dark:text-slate-600"
                  />
                )}
                {/* Income point */}
                <circle cx={x} cy={getY(d.income)} r={isSelected ? 5 : 3.5} fill="#10b981" />
                {/* Expense point */}
                <circle cx={x} cy={getY(d.expenses)} r={isSelected ? 5 : 3.5} fill="#ef4444" />
                {/* Savings point */}
                <circle cx={x} cy={getY(d.netSavings)} r={isSelected ? 5 : 3.5} fill="#6366f1" />

                {/* X-axis Label */}
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 dark:fill-slate-400 font-medium"
                >
                  {d.dateLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Point Popover */}
        {activeIdx !== null && data[activeIdx] && (
          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between text-xs gap-4">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {data[activeIdx].dateLabel}
            </span>
            <div className="flex items-center gap-4 tabular-nums">
              <span className="text-emerald-600 dark:text-emerald-400">
                Income: {formatCurrency(data[activeIdx].income, currency)}
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                Expenses: {formatCurrency(data[activeIdx].expenses, currency)}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                Savings: {formatCurrency(data[activeIdx].netSavings, currency)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
