import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { ShieldAlert, TrendingUp } from 'lucide-react';

export const RiskDistributionChart: React.FC = () => {
  const { riskDistribution, darkMode } = useInvoiceStore();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalInvoices = riskDistribution.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalInvoices) * 100).toFixed(1);
      return (
        <div className="p-4 bg-white/95 dark:bg-zinc-900/95 border border-emerald-500/40 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-1 select-none text-zinc-900 dark:text-white">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="text-xs font-bold">{data.name}</span>
          </div>
          <div className="text-xl font-extrabold mt-1">
            {data.value} <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">Invoices</span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{percentage}% of Total Audited</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="glass" className="relative flex flex-col h-full overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 shadow-lg dark:shadow-2xl transition-colors duration-300">
      {/* Background Ambient Mesh Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Risk Score Distribution
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              Live AI Audit
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Categorization across risk thresholds</p>
        </div>
        <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-emerald-600 dark:text-emerald-400 shadow-inner">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      {/* Circular Chart Container with Grid Dot Texture Background */}
      <div className="relative w-full h-64 flex items-center justify-center z-10 rounded-2xl bg-[radial-gradient(#e4e4e7_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#27272a_1.2px,transparent_1.2px)] [background-size:14px_14px] border border-zinc-200/60 dark:border-zinc-800/60">
        {/* Subtle Concentric Rings Texture */}
        <div className="absolute w-52 h-52 rounded-full border border-zinc-300/40 dark:border-zinc-800/60 pointer-events-none" />
        <div className="absolute w-36 h-36 rounded-full border border-dashed border-zinc-300/60 dark:border-zinc-700/50 pointer-events-none" />

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={riskDistribution}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={5}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {riskDistribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={activeIndex === index ? (darkMode ? '#ffffff' : '#09090b') : (darkMode ? '#18181b' : '#ffffff')}
                  strokeWidth={activeIndex === index ? 3 : 2}
                  className="transition-all duration-300 cursor-pointer hover:opacity-90"
                  style={{
                    filter: activeIndex === index ? `drop-shadow(0 0 12px ${entry.color})` : 'none',
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Ring Display */}
        <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center bg-white/80 dark:bg-zinc-950/80 p-3 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-md">
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {totalInvoices}
          </span>
          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Total</span>
        </div>
      </div>

      {/* Interactive Legend Cards with Adaptive Theme Colors */}
      <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 z-10 text-xs">
        {riskDistribution.map((item, idx) => {
          const pct = ((item.value / totalInvoices) * 100).toFixed(0);
          return (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                activeIndex === idx
                  ? 'bg-zinc-100 dark:bg-zinc-800/80 border-emerald-500/40 shadow-sm translate-x-0.5'
                  : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-800 dark:text-zinc-300 font-semibold truncate max-w-[90px]">{item.name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-zinc-900 dark:text-white">{item.value}</span>
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
