import React from 'react';
import { Card } from '../atoms/Card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { Activity, Sparkles, ArrowUpRight } from 'lucide-react';

export const InvoiceVolumeTrendChart: React.FC = () => {
  const { darkMode } = useInvoiceStore();

  const trendData = [
    { month: 'Feb', TotalAudited: 680, FlaggedCount: 18, TimeSaved: 120 },
    { month: 'Mar', TotalAudited: 820, FlaggedCount: 22, TimeSaved: 160 },
    { month: 'Apr', TotalAudited: 950, FlaggedCount: 28, TimeSaved: 210 },
    { month: 'May', TotalAudited: 1100, FlaggedCount: 31, TimeSaved: 270 },
    { month: 'Jun', TotalAudited: 1190, FlaggedCount: 35, TimeSaved: 300 },
    { month: 'Jul', TotalAudited: 1248, FlaggedCount: 38, TimeSaved: 320 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 bg-white/95 dark:bg-[#121215]/95 border border-slate-200 dark:border-white/15 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-2 select-none min-w-[210px] text-zinc-900 dark:text-white">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
            <span className="text-xs font-bold flex items-center gap-1.5 text-zinc-900 dark:text-white">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {label} 2026 Audit Summary
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              Verified
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-[#7E7E7E]">Total Invoices Audited:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{payload[0].value}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-[#7E7E7E]">Flagged Risk Anomalies:</span>
            <span className="font-extrabold text-rose-500 dark:text-rose-400">{payload[1]?.value || 0}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="glass" className="relative flex flex-col justify-between h-full overflow-hidden border border-zinc-200 dark:border-[#8D9797]/30 bg-white/90 dark:bg-[#1c1c22] shadow-lg dark:shadow-2xl transition-colors duration-300 p-6">
      {/* Background Ambient Mesh Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#8D9797]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F3DDB6] tracking-tight">
              Monthly Audit Volume & Risk Trajectory
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8D9797]/15 text-[#8D9797] border border-[#8D9797]/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Trend
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-[#7E7E7E] mt-0.5">Historical growth in audited volume vs exception detection</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#8D9797]/15 border border-[#8D9797]/30 text-[#8D9797] text-xs font-bold shrink-0">
          <ArrowUpRight className="w-4 h-4" />
          <span>+24.8% Monthly Scale</span>
        </div>
      </div>

      <div className="w-full flex-1 min-h-[250px] my-3 z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 24, right: 16, left: -5, bottom: 8 }}>
            <defs>
              <linearGradient id="auditedArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="flaggedArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(255,255,255,0.08)' : '#e4e4e7'} />
            <XAxis dataKey="month" stroke={darkMode ? '#7E7E7E' : '#94a3b8'} tick={{ fill: darkMode ? '#F3DDB6' : '#475569', fontSize: 11 }} tickMargin={8} />
            <YAxis stroke={darkMode ? '#7E7E7E' : '#94a3b8'} tick={{ fill: darkMode ? '#F3DDB6' : '#475569', fontSize: 11 }} tickMargin={6} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="TotalAudited" stroke="#10b981" strokeWidth={3} fill="url(#auditedArea)" name="Total Audited" />
            <Area type="monotone" dataKey="FlaggedCount" stroke="#f43f5e" strokeWidth={2.5} fill="url(#flaggedArea)" name="Flagged Exceptions" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Summary & Legend Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2 pt-3 border-t border-zinc-200 dark:border-white/10 z-10 text-xs">
        <div className="flex flex-col p-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-[#7E7E7E] text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Total Audited</span>
          </div>
          <span className="font-extrabold text-sm text-zinc-900 dark:text-white mt-0.5">1,248</span>
        </div>

        <div className="flex flex-col p-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-[#7E7E7E] text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">Flagged Risks</span>
          </div>
          <span className="font-extrabold text-sm text-zinc-900 dark:text-white mt-0.5">38</span>
        </div>

        <div className="flex flex-col p-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-[#7E7E7E] text-[11px]">
            <Activity className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="truncate">Time Saved</span>
          </div>
          <span className="font-extrabold text-sm text-zinc-900 dark:text-white mt-0.5">320 hrs</span>
        </div>

        <div className="flex flex-col p-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-[#7E7E7E] text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">AI Accuracy</span>
          </div>
          <span className="font-extrabold text-sm text-zinc-900 dark:text-white mt-0.5">99.4%</span>
        </div>
      </div>
    </Card>
  );
};
