import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { FilterBar } from '../components/molecules/FilterBar';
import { InvoiceTable } from '../components/organisms/InvoiceTable';
import { QuickInvoiceDrawer } from '../components/organisms/QuickInvoiceDrawer';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { FileSpreadsheet, Sparkles } from 'lucide-react';
import { Invoice } from '../types/invoice';

export const InvoiceListPage: React.FC = () => {
  const { invoices, searchQuery, selectedRiskFilter, selectedStatusFilter } = useInvoiceStore();
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

  return (
    <AppLayout title="Audit Invoice Repository">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
              Audited Invoices ({filteredInvoices.length})
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
              Multi-parameter search across GSTINs, PO numbers, risk scores, and approval statuses
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-yellow-400 text-xs font-bold shrink-0">
            <Sparkles className="w-4 h-4" />
            <span>AI Risk Scoring Active</span>
          </div>
        </div>

        <FilterBar />
        <InvoiceTable
          invoices={filteredInvoices}
          pageSize={10}
          onQuickInspect={(inv) => setSelectedDrawerInvoice(inv)}
        />

        <QuickInvoiceDrawer
          invoice={selectedDrawerInvoice}
          onClose={() => setSelectedDrawerInvoice(null)}
        />
      </div>
    </AppLayout>
  );
};

