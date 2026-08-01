import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { TrendingUp } from 'lucide-react';

export const VendorAnalyticsChart: React.FC = () => {
  const { vendorStats, darkMode } = useInvoiceStore();
  const [activeTab, setActiveTab] = useState<'all' | 'high_risk'>('all');

  const filteredStats = activeTab === 'high_risk'
    ? vendorStats.filter((v) => v.riskScore >= 40)
    : vendorStats;

  const formattedData = filteredStats.map((v) => ({
    fullName: v.vendorName,
    name: v.vendorName.length > 15 ? v.vendorName.substring(0, 12) + '...' : v.vendorName,
    SpendInLakhs: Number((v.totalSpend / 100000).toFixed(1)),
    RiskScore: v.riskScore,
    status: v.status,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-4 bg-white/95 dark:bg-zinc-900/95 border border-emerald-500/40 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-2 select-none min-w-[200px] text-zinc-900 dark:text-white">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">{data.fullName}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                data.status === 'VERIFIED'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {data.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-zinc-500 dark:text-zinc-400">Total Billed Spend:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{data.SpendInLakhs} Lakhs</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">AI Risk Score:</span>
            <span className={`font-extrabold ${data.RiskScore >= 70 ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'}`}>
              {data.RiskScore} / 100
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="glass" className="relative flex flex-col h-full overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 shadow-lg dark:shadow-2xl transition-colors duration-300">
      {/* Background Ambient Mesh Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Vendor Risk & Billed Spend
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30">
              Analytics
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Spend volume (₹ Lakhs) vs Risk Rating</p>
        </div>

        {/* Tab Selector Pill */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            All Vendors
          </button>
          <button
            onClick={() => setActiveTab('high_risk')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'high_risk'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Flagged Only
          </button>
        </div>
      </div>

      <div className="w-full h-64 z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#047857" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#b45309" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#27272a' : '#e4e4e7'} />
            <XAxis
              dataKey="name"
              stroke={darkMode ? '#71717a' : '#94a3b8'}
              tick={{ fill: darkMode ? '#a1a1aa' : '#475569', fontSize: 11 }}
              angle={-20}
              textAnchor="end"
            />
            <YAxis stroke={darkMode ? '#71717a' : '#94a3b8'} tick={{ fill: darkMode ? '#a1a1aa' : '#475569', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: darkMode ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.08)' }} />
            <Bar dataKey="SpendInLakhs" fill="url(#spendGradient)" radius={[8, 8, 0, 0]} name="Spend (₹ Lakhs)" />
            <Bar dataKey="RiskScore" fill="url(#riskGradient)" radius={[8, 8, 0, 0]} name="Risk Score (0-100)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stat Pills */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 z-10 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Spend Volume</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Risk Score</span>
        </div>
        <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Peak Audit Month: July 2026</span>
        </div>
      </div>
    </Card>
  );
};
