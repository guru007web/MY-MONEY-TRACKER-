import React, { useState } from 'react';
import { formatCurrency } from '../../utils/storage';
import { CurrencyCode } from '../../types/finance';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: { label: string; value: number }[];
  currency?: CurrencyCode;
  height?: number;
}

const PALETTE = [
  '#4f46e5', // indigo-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#e11d48', // rose-600
  '#0284c7', // sky-600
  '#7c3aed', // violet-600
  '#ea580c', // orange-600
  '#0891b2', // cyan-600
  '#475569', // slate-600
  '#65a30d', // lime-600
];

export const DonutChart: React.FC<DonutChartProps> = ({ data, currency = 'INR', height = 260 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 min-h-[220px]">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm">No transaction data available yet</p>
      </div>
    );
  }

  const segments: DonutSegment[] = data.map((item, index) => ({
    label: item.label,
    value: item.value,
    color: PALETTE[index % PALETTE.length],
  }));

  // Calculate SVG arc paths
  const size = 200;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
      {/* SVG Donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          {segments.map((seg, idx) => {
            const percent = seg.value / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            const isHovered = hoveredIndex === idx;

            return (
              <circle
                key={seg.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          {hoveredIndex !== null ? (
            <>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[120px]">
                {segments[hoveredIndex].label}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatCurrency(segments[hoveredIndex].value, currency)}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {((segments[hoveredIndex].value / total) * 100).toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                Total
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatCurrency(total, currency)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {segments.length} Categories
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend / Category List */}
      <div className="flex-1 w-full max-h-[220px] overflow-y-auto pr-1 space-y-2">
        {segments.map((seg, idx) => {
          const pct = ((seg.value / total) * 100).toFixed(1);
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={seg.label}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between text-xs p-2 rounded-lg transition-colors cursor-pointer ${
                isHovered
                  ? 'bg-slate-100 dark:bg-slate-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-right">
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(seg.value, currency)}
                </span>
                <span className="text-slate-400 dark:text-slate-500 w-10 text-right tabular-nums">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
