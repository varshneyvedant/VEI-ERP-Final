'use client';

import { Timeframe } from '@/lib/timeframe';

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (value: Timeframe) => void;
}

import { Calendar } from 'lucide-react';

export default function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  const options: { label: string; value: Timeframe }[] = [
    { label: 'Today', value: '1D' },
    { label: '1 Week', value: '1W' },
    { label: '1 Month', value: '1M' },
    { label: '3 Months', value: '3M' },
    { label: '6 Months', value: '6M' },
    { label: '1 Year', value: '1Y' },
    { label: 'Last FY', value: 'FY' },
    { label: '3 Years', value: '3Y' },
    { label: '5 Years', value: '5Y' },
    { label: '10 Years', value: '10Y' },
    { label: 'All Time', value: 'ALL' },
  ];

  return (
    <div className="w-full sm:w-auto">
      {/* Mobile Select View (Screens < 640px) */}
      <div className="sm:hidden flex items-center gap-2 bg-[#1e1e1e] p-2 rounded-lg border border-[#333] w-full">
        <Calendar size={16} className="text-red-500 shrink-0" />
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider shrink-0">Range:</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as Timeframe)}
          className="bg-[#2a2a2a] text-white text-sm font-semibold rounded px-2.5 py-1.5 border border-[#444] focus:outline-none focus:ring-1 focus:ring-red-500 w-full"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop/Tablet Horizontal Pill Strip */}
      <div className="hidden sm:flex items-center gap-2 bg-[#1e1e1e] p-1.5 rounded-lg border border-[#333] w-fit max-w-full overflow-x-auto no-scrollbar">
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-2 shrink-0">Timeframe:</span>
        <div className="flex items-center gap-1 shrink-0">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                value === opt.value
                  ? 'bg-red-500 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
