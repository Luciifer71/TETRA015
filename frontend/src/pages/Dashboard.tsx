import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { MetricCard } from '../components/molecules/MetricCard';
import { RiskDistributionChart } from '../components/organisms/RiskDistributionChart';
import { VendorAnalyticsChart } from '../components/organisms/VendorAnalyticsChart';
import { InvoiceVolumeTrendChart } from '../components/organisms/InvoiceVolumeTrendChart';
import { InvoiceTable } from '../components/organisms/InvoiceTable';
import { FilterBar } from '../components/molecules/FilterBar';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { FileCheck, ShieldAlert, Clock, Sparkles } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { invoices, summary, searchQuery, selectedRiskFilter, selectedStatusFilter } = useInvoiceStore();

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
      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Audited Invoices"
          value={summary.totalAudited}
          change="+14.2% vs last month"
          isPositive={true}
          icon={<FileCheck className="w-6 h-6 text-emerald-400" />}
          iconBgColor="bg-emerald-500/10"
        />
        <MetricCard
          title="Processed Volume"
          value={formatCurrency(summary.totalAmountProcessed)}
          subtitle="97.8% AI Accuracy Rate"
          icon={<Sparkles className="w-6 h-6 text-teal-400" />}
          iconBgColor="bg-teal-500/10"
        />
        <MetricCard
          title="High / Critical Risk"
          value={summary.highRiskCount}
          change="-4.5% risk reduction"
          isPositive={true}
          icon={<ShieldAlert className="w-6 h-6 text-rose-400" />}
          iconBgColor="bg-rose-500/10"
        />
        <MetricCard
          title="Pending Auditor Review"
          value={summary.pendingReviewCount}
          subtitle={`${summary.timeSavedHours} Hours Saved`}
          icon={<Clock className="w-6 h-6 text-amber-400" />}
          iconBgColor="bg-amber-500/10"
        />
      </div>

      {/* Pop-up Graphs Grid (Nixtio HR Dashboard Style) */}
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
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">Recent Invoice Audits</h2>
          <span className="text-xs text-zinc-400">Live AI Risk Scoring System</span>
        </div>

        <FilterBar />
        <InvoiceTable invoices={filteredInvoices} pageSize={6} />
      </div>
    </AppLayout>
  );
};
