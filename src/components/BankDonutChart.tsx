import React, { useState } from 'react';
import { formatRp } from '../utils/formatters';
import { BankCalculatedBalance } from '../types';

interface BankDonutChartProps {
  bankBalances: Record<string, BankCalculatedBalance>;
}

export const BankDonutChart: React.FC<BankDonutChartProps> = ({ bankBalances }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const colors = [
    '#8B5CF6', // Purple
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#06B6D4', // Cyan
  ];

  const items = Object.entries(bankBalances).map(([name, data], idx) => ({
    name,
    amount: Math.max(0, data.saldoAkhir),
    color: colors[idx % colors.length],
  }));

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  // If no banks or total is 0
  if (items.length === 0 || total === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
        <p className="text-sm">Belum ada saldo bank tercatat.</p>
      </div>
    );
  }

  // Calculate SVG arc paths
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const slices = items.map((item, idx) => {
    const fraction = item.amount / total;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += fraction * circumference;
    return {
      ...item,
      percentage: (fraction * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      idx,
    };
  });

  const activeItem = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 h-full">
      {/* SVG Donut */}
      <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice) => (
            <circle
              key={slice.name}
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-300 cursor-pointer"
              style={{
                opacity: hoveredIdx === null || hoveredIdx === slice.idx ? 1 : 0.4,
                filter: hoveredIdx === slice.idx ? 'drop-shadow(0 0 6px currentColor)' : 'none',
              }}
              onMouseEnter={() => setHoveredIdx(slice.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            {activeItem ? activeItem.name : 'Total Bank'}
          </span>
          <span className="text-sm font-bold text-white font-mono mt-0.5 truncate max-w-[130px]">
            {activeItem ? formatRp(activeItem.amount) : formatRp(total)}
          </span>
          {activeItem && (
            <span className="text-[10px] text-purple-300 font-mono font-medium mt-0.5">
              {activeItem.percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full space-y-2.5 overflow-y-auto max-h-48 pr-1">
        {slices.map((slice) => (
          <div
            key={slice.name}
            onMouseEnter={() => setHoveredIdx(slice.idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
              hoveredIdx === slice.idx ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-xs font-semibold text-slate-200 truncate">
                {slice.name}
              </span>
            </div>
            <div className="text-right shrink-0 pl-2">
              <div className="text-xs font-bold text-white font-mono">
                {formatRp(slice.amount)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {slice.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
