import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { MetricCard } from '../components/molecules/MetricCard';
import { RiskDistributionChart } from '../components/organisms/RiskDistributionChart';
import { VendorAnalyticsChart } from '../components/organisms/VendorAnalyticsChart';
import { InvoiceVolumeTrendChart } from '../components/organisms/InvoiceVolumeTrendChart';
import { InvoiceTable } from '../components/organisms/InvoiceTable';
import { QuickInvoiceDrawer } from '../components/organisms/QuickInvoiceDrawer';
import { FilterBar } from '../components/molecules/FilterBar';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { useAuthStore } from '../store/useAuthStore';
import { FileCheck, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { Invoice } from '../types/invoice';

export const Dashboard: React.FC = () => {
  const { invoices, summary, searchQuery, selectedRiskFilter, selectedStatusFilter } = useInvoiceStore();
  const { user } = useAuthStore();
  const [selectedDrawerInvoice, setSelectedDrawerInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.vendorGstin.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk = selectedRiskFilter === 'ALL' || inv.riskLevel === selectedRiskFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || inv.status === selectedStatusFilter;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  };

  return (
    <AppLayout title="Dashboard Overview">
      {/* Reference UI Inspired Top Welcome & Stat Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/90 dark:bg-[#1c1c22] border border-[#D0D0D2] dark:border-[#8D9797]/30 shadow-sm dark:shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#2E2E2D] dark:text-white tracking-tight">
              Welcome back, {user.name.split(' ')[0]}
            </h2>
            <p className="text-xs font-medium text-[#4B4C51] dark:text-[#7E7E7E] mt-0.5">
              Live AI invoice screening & GSTN compliance workspace
            </p>
          </div>

          {/* Reference UI Segmented Progress Bar & Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
              Low Risk 67%
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border border-yellow-500/30 shadow-sm">
              Medium 30%
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-orange-500/15 text-orange-800 dark:text-orange-300 border border-orange-500/30 shadow-sm">
              High Risk 2.5%
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-red-500/20 text-red-800 dark:text-red-300 border border-red-500/40 shadow-sm">
              Critical 0.5%
            </span>
          </div>
        </div>

        {/* Reference UI Top Right Minimal Stat Display (Number + Label below) */}
        <div className="flex items-center gap-8 sm:gap-12 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#D0D0D2] dark:border-white/10">
          <div className="flex flex-col items-start sm:items-end">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-3xl font-black text-[#2E2E2D] dark:text-white font-mono tracking-tight">{summary.totalAudited}</span>
            </div>
            <span className="text-xs font-bold text-[#4B4C51] dark:text-[#7E7E7E] uppercase tracking-wider mt-0.5">Audited</span>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span className="text-3xl font-black text-[#2E2E2D] dark:text-white font-mono tracking-tight">{summary.highRiskCount}</span>
            </div>
            <span className="text-xs font-bold text-[#4B4C51] dark:text-[#7E7E7E] uppercase tracking-wider mt-0.5">Flags</span>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2E2E2D] dark:text-[#F3DDB6]" />
              <span className="text-3xl font-black text-[#2E2E2D] dark:text-white font-mono tracking-tight">{summary.pendingReviewCount}</span>
            </div>
            <span className="text-xs font-bold text-[#4B4C51] dark:text-[#7E7E7E] uppercase tracking-wider mt-0.5">Pending</span>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Audited Invoices"
          value={summary.totalAudited}
          change="+14.2% vs last month"
          isPositive={true}
          icon={<FileCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          iconBgColor="bg-emerald-500/10"
        />
        <MetricCard
          title="Processed Volume"
          value={formatCurrency(summary.totalAmountProcessed)}
          subtitle="97.8% AI Accuracy Rate"
          icon={<Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          iconBgColor="bg-blue-500/10"
        />
        <MetricCard
          title="High / Critical Risk"
          value={summary.highRiskCount}
          change="-4.5% risk reduction"
          isPositive={true}
          icon={<ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />}
          iconBgColor="bg-rose-500/10"
        />
        <MetricCard
          title="Pending Auditor Review"
          value={summary.pendingReviewCount}
          subtitle={`${summary.timeSavedHours} Hours Saved`}
          icon={<Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
          iconBgColor="bg-indigo-500/10"
        />
      </div>

      {/* Pop-up Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InvoiceVolumeTrendChart />
        </div>
        <div className="lg:col-span-1">
          <RiskDistributionChart />
        </div>
      </div>

      <div className="w-full">
        <VendorAnalyticsChart />
      </div>

      {/* Filter Bar & Recent Invoices Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">Recent Invoice Audits</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-yellow-400 border border-amber-500/30">
              Live AI Scoring
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-[#A4A6A8]">Click any row for quick AI risk inspection</span>
        </div>

        <FilterBar />
        <InvoiceTable
          invoices={filteredInvoices}
          pageSize={6}
          onQuickInspect={(inv) => setSelectedDrawerInvoice(inv)}
        />
      </div>

      {/* Slide-over Quick Drawer */}
      <QuickInvoiceDrawer
        invoice={selectedDrawerInvoice}
        onClose={() => setSelectedDrawerInvoice(null)}
      />
    </AppLayout>
  );
};

