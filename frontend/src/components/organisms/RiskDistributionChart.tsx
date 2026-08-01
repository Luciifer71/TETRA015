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
        <div className="p-4 bg-white/95 dark:bg-[#121215]/95 border border-slate-200 dark:border-white/15 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-1 select-none text-zinc-900 dark:text-white">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">{data.name}</span>
          </div>
          <div className="text-xl font-extrabold mt-1 text-zinc-900 dark:text-white">
            {data.value} <span className="text-xs text-zinc-500 dark:text-slate-400 font-normal">Invoices</span>
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
    <Card variant="glass" className="relative flex flex-col h-full overflow-hidden border border-zinc-200 dark:border-[#8D9797]/30 bg-white/90 dark:bg-[#1c1c22] shadow-lg dark:shadow-2xl transition-colors duration-300 p-6">
      {/* Background Ambient Mesh Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#8D9797]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-2 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F3DDB6] tracking-tight">
              Audit Risk Tracker
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3DDB6]/15 text-[#F3DDB6] border border-[#F3DDB6]/30">
              Live Ring
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-[#7E7E7E] mt-0.5">Real-time risk categorization</p>
        </div>
        <div className="p-2 rounded-2xl bg-zinc-100 dark:bg-[#121215] border border-zinc-200 dark:border-[#8D9797]/30 text-[#F3DDB6] shadow-inner">
          <ShieldAlert className="w-4 h-4 text-[#F3DDB6]" />
        </div>
      </div>

      {/* Circular Chart Container with Dotted Tick Marks Dial directly overlapping behind chart ring */}
      <div className="relative w-full h-60 flex items-center justify-center z-10 my-2">
        {/* SVG Radial Tick Marks Dial (Overlapped under the chart ring arc) */}
        <svg className="absolute w-52 h-52 pointer-events-none z-0" viewBox="0 0 200 200">
          {Array.from({ length: 48 }).map((_, i) => {
            const angle = (i * 360) / 48;
            const rad = (angle * Math.PI) / 180;
            // Radii 62 to 80 to directly overlap under innerRadius={62} & outerRadius={78}
            const x1 = 100 + 60 * Math.cos(rad);
            const y1 = 100 + 60 * Math.sin(rad);
            const x2 = 100 + 80 * Math.cos(rad);
            const y2 = 100 + 80 * Math.sin(rad);
            const isMajor = i % 4 === 0;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? (darkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)') : (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)')}
                strokeWidth={isMajor ? "2" : "1"}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        <ResponsiveContainer width="100%" height="100%" className="z-10">
          <PieChart>
            <Pie
              data={riskDistribution}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={78}
              paddingAngle={6}
              dataKey="value"
              cornerRadius={6}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {riskDistribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={activeIndex === index ? (darkMode ? '#000000' : '#0f172a') : (darkMode ? '#1c1c22' : '#ffffff')}
                  strokeWidth={activeIndex === index ? 3 : 2}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: 'none',
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Ring Display - Reference Image Time Tracker Style */}
        <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center bg-white/90 dark:bg-[#121215]/95 w-28 h-28 rounded-full border border-zinc-200 dark:border-white/10 shadow-xl backdrop-blur-md">
          <span className="text-3xl font-black text-slate-950 dark:text-[#F3DDB6] tracking-tight font-mono">
            {totalInvoices}
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-[#7E7E7E] uppercase tracking-wider mt-0.5">Invoices</span>
        </div>
      </div>

      {/* Action Controls Bar (Reference Image Style: Play, Pause, Settings) */}
      <div className="flex items-center justify-center gap-3 pt-1 border-t border-zinc-200 dark:border-white/10 z-10">
        <button className="p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-[#F3DDB6] transition-colors">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button className="p-2 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-[#F3DDB6] transition-colors">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
      </div>

      {/* Interactive Legend Cards */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-200 dark:border-white/10 z-10 text-xs">
        {riskDistribution.map((item, idx) => {
          const pct = ((item.value / totalInvoices) * 100).toFixed(0);
          return (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                activeIndex === idx
                  ? 'bg-zinc-100 dark:bg-white/10 border-[#F3DDB6]/40 shadow-sm translate-x-0.5'
                  : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-800 dark:text-[#F3DDB6] font-medium truncate max-w-[80px]">{item.name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-zinc-900 dark:text-white">{item.value}</span>
                <span className="text-[10px] font-mono text-zinc-500 dark:text-[#7E7E7E]">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
