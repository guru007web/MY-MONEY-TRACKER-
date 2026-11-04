import React, { useState } from 'react';
import { formatCurrency } from '../../utils/storage';
import { CurrencyCode } from '../../types/finance';

export interface MonthlyBarData {
  month: string; // e.g. "Oct 2026"
  income: number;
  expenses: number;
}

interface BarChartProps {
  data: MonthlyBarData[];
  currency?: CurrencyCode;
}

export const BarChart: React.FC<BarChartProps> = ({ data, currency = 'INR' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 min-h-[220px]">
        <span className="text-3xl mb-2">⚖️</span>
        <p className="text-sm">No monthly comparison data yet</p>
      </div>
    );
  }

  const maxVal = Math.max(
    100,
    ...data.map((d) => Math.max(d.income, d.expenses))
  );

  return (
    <div className="w-full space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-end gap-5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">Expenses</span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative h-64 w-full">
        <div className="absolute inset-0 flex items-end justify-between gap-3 pt-6 pb-8 border-b border-slate-200 dark:border-slate-800">
          {data.map((item, idx) => {
            const incHeightPct = Math.min(100, Math.max(4, (item.income / maxVal) * 100));
            const expHeightPct = Math.min(100, Math.max(4, (item.expenses / maxVal) * 100));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[11px] py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap pointer-events-none">
                    <div className="font-semibold">{item.month}</div>
                    <div className="text-emerald-400">+{formatCurrency(item.income, currency)}</div>
                    <div className="text-rose-400">-{formatCurrency(item.expenses, currency)}</div>
                  </div>
                )}

                {/* Bars Pair */}
                <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-full">
                  {/* Income Bar */}
                  <div
                    style={{ height: `${incHeightPct}%` }}
                    className="w-1/2 max-w-[28px] rounded-t bg-emerald-500 hover:bg-emerald-400 transition-all duration-200"
                  />
                  {/* Expense Bar */}
                  <div
                    style={{ height: `${expHeightPct}%` }}
                    className="w-1/2 max-w-[28px] rounded-t bg-rose-500 hover:bg-rose-400 transition-all duration-200"
                  />
                </div>

                {/* Month label */}
                <span className="absolute -bottom-6 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-full">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
