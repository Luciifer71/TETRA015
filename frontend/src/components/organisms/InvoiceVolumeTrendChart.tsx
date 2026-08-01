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
        <div className="p-4 bg-white/95 dark:bg-zinc-900/95 border border-emerald-500/40 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-2 select-none min-w-[210px] text-zinc-900 dark:text-white">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {label} 2026 Audit Summary
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              Verified
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Total Invoices Audited:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{payload[0].value}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Flagged Risk Anomalies:</span>
            <span className="font-extrabold text-rose-500 dark:text-rose-400">{payload[1]?.value || 0}</span>
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Monthly Audit Volume & Risk Trajectory
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Trend
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Historical growth in audited volume vs exception detection</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0">
          <ArrowUpRight className="w-4 h-4" />
          <span>+24.8% Monthly Scale</span>
        </div>
      </div>

      <div className="w-full h-64 z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#27272a' : '#e4e4e7'} />
            <XAxis dataKey="month" stroke={darkMode ? '#71717a' : '#94a3b8'} tick={{ fill: darkMode ? '#a1a1aa' : '#475569', fontSize: 11 }} />
            <YAxis stroke={darkMode ? '#71717a' : '#94a3b8'} tick={{ fill: darkMode ? '#a1a1aa' : '#475569', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="TotalAudited" stroke="#10b981" strokeWidth={3} fill="url(#auditedArea)" name="Total Audited" />
            <Area type="monotone" dataKey="FlaggedCount" stroke="#f43f5e" strokeWidth={2.5} fill="url(#flaggedArea)" name="Flagged Exceptions" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
