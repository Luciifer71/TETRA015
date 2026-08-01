import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ExtractedDataPanel } from '../components/organisms/ExtractedDataPanel';
import { AuditTimeline } from '../components/organisms/AuditTimeline';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { Button } from '../components/atoms/Button';
import { ChevronLeft, FileText, ShieldAlert, History } from 'lucide-react';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices } = useInvoiceStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');

  const invoice = invoices.find((inv) => inv.id === id) || invoices[0];

  if (!invoice) {
    return (
      <AppLayout title="Invoice Detail Inspector">
        <div className="p-12 text-center text-slate-400">
          <p>Invoice not found.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Invoice Inspector - ${invoice.invoiceNumber}`}>
      <div className="space-y-6">
        {/* Navigation & Tab Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => navigate('/invoices')}
          >
            Back to Repository
          </Button>

          <div className="flex items-center gap-2 bg-slate-200 dark:bg-[#10120D] p-1.5 rounded-2xl border border-slate-300 dark:border-[#263C49]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-slate-700 dark:text-[#AAABB0] hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Extracted Data & Risk</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'audit'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-slate-700 dark:text-[#AAABB0] hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log ({invoice.auditLogs.length})</span>
            </button>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <ExtractedDataPanel invoice={invoice} />
        ) : (
          <AuditTimeline logs={invoice.auditLogs} />
        )}
      </div>
    </AppLayout>
  );
};
