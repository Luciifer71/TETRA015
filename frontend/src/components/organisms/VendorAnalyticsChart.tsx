import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="p-4 bg-white/95 dark:bg-[#121215]/95 border border-slate-200 dark:border-white/15 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-2 select-none min-w-[200px] text-zinc-900 dark:text-white">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/10">
            <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">{data.fullName}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${data.status === 'VERIFIED'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-[#F3DDB6] border border-[#F3DDB6]/30'
                }`}
            >
              {data.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-zinc-500 dark:text-[#7E7E7E]">Total Billed Spend:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{data.SpendInLakhs} Lakhs</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-[#7E7E7E]">AI Risk Score:</span>
            <span className={`font-extrabold ${data.RiskScore >= 70 ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-[#F3DDB6]'}`}>
              {data.RiskScore} / 100
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="glass" className="relative flex flex-col h-full overflow-hidden border border-zinc-200 dark:border-[#8D9797]/30 bg-white/90 dark:bg-[#1c1c22] shadow-lg dark:shadow-2xl transition-colors duration-300">
      {/* Background Ambient Mesh Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#8D9797]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F3DDB6] tracking-tight">
              Vendor Risk & Billed Spend
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8D9797]/15 text-[#8D9797] border border-[#8D9797]/30">
              Analytics
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-[#7E7E7E] mt-0.5">Spend volume (₹ Lakhs) vs Risk Rating</p>
        </div>

        {/* Tab Selector Pill with Smooth Framer Motion Background Slide */}
        <div className="relative flex items-center gap-1 p-1 bg-zinc-100 dark:bg-[#292929]/80 rounded-xl border border-zinc-200 dark:border-[#7E7E7E]/40 shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`relative z-10 px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-colors duration-200 ${
              activeTab === 'all'
                ? 'text-[#292929]'
                : 'text-zinc-600 dark:text-[#7E7E7E] hover:text-zinc-900 dark:hover:text-[#F3DDB6]'
            }`}
          >
            {activeTab === 'all' && (
              <motion.div
                layoutId="vendorTabHighlight"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 bg-[#F3DDB6] rounded-lg shadow-md -z-10"
              />
            )}
            All Vendors
          </button>

          <button
            onClick={() => setActiveTab('high_risk')}
            className={`relative z-10 px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-colors duration-200 ${
              activeTab === 'high_risk'
                ? 'text-[#292929]'
                : 'text-zinc-600 dark:text-[#7E7E7E] hover:text-zinc-900 dark:hover:text-[#F3DDB6]'
            }`}
          >
            {activeTab === 'high_risk' && (
              <motion.div
                layoutId="vendorTabHighlight"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-0 bg-[#F3DDB6] rounded-lg shadow-md -z-10"
              />
            )}
            Flagged Only
          </button>
        </div>
      </div>

      {/* Animated Chart Area with Key-Based Cross-Fade */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full h-64 z-10"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#047857" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F3DDB6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#c59f64" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#7E7E7E/30' : '#e4e4e7'} />
            <XAxis
              dataKey="name"
              stroke={darkMode ? '#7E7E7E' : '#94a3b8'}
              tick={{ fill: darkMode ? '#F3DDB6' : '#475569', fontSize: 11 }}
              angle={-20}
              textAnchor="end"
            />
            <YAxis stroke={darkMode ? '#7E7E7E' : '#94a3b8'} tick={{ fill: darkMode ? '#F3DDB6' : '#475569', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: darkMode ? 'rgba(243, 221, 182, 0.08)' : 'rgba(16, 185, 129, 0.08)' }} />
            <Bar
              dataKey="SpendInLakhs"
              fill="url(#spendGradient)"
              radius={[8, 8, 0, 0]}
              name="Spend (₹ Lakhs)"
              isAnimationActive={true}
              animationDuration={400}
              animationEasing="ease-in-out"
            />
            <Bar
              dataKey="RiskScore"
              fill="url(#riskGradient)"
              radius={[8, 8, 0, 0]}
              name="Risk Score (0-100)"
              isAnimationActive={true}
              animationDuration={400}
              animationEasing="ease-in-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

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
