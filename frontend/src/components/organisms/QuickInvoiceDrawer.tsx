import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldAlert, CheckCircle2, FileWarning, XCircle, Building2, Calendar, Check } from 'lucide-react';
import { Invoice } from '../../types/invoice';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface QuickInvoiceDrawerProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const QuickInvoiceDrawer: React.FC<QuickInvoiceDrawerProps> = ({ invoice, onClose }) => {
  const navigate = useNavigate();
  const { updateInvoiceStatus } = useInvoiceStore();

  if (!invoice) return null;

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  };

  const handleAction = (status: 'APPROVED' | 'FLAGGED' | 'REJECTED') => {
    updateInvoiceStatus(invoice.id, status);
    toast.success(`Invoice ${invoice.invoiceNumber} marked as ${status}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Slide-over Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c22] text-[#2E2E2D] dark:text-[#F3DDB6] border-l border-slate-200 dark:border-[#8D9797]/25 shadow-2xl h-full flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 bg-[#F3F3F3] dark:bg-[#121215]">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black tracking-tight text-[#2E2E2D] dark:text-[#F3DDB6]">{invoice.invoiceNumber}</h2>
                <Badge type="risk" value={invoice.riskLevel} />
                <Badge type="status" value={invoice.status} />
              </div>
              <p className="text-xs text-[#4B4C51] dark:text-[#7E7E7E] mt-1">Quick Risk Inspector & Audit Action Panel</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#4B4C51] hover:text-[#2E2E2D] dark:hover:text-white hover:bg-[#D0D0D2]/40 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Vendor & General Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F3F3F3] dark:bg-[#121215] border border-[#D0D0D2] dark:border-white/10">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4B4C51] dark:text-[#7E7E7E] uppercase flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Vendor Name
                </span>
                <p className="text-sm font-bold text-[#2E2E2D] dark:text-[#F3DDB6]">{invoice.vendorName}</p>
                <p className="text-xs font-mono text-[#4B4C51] dark:text-[#7E7E7E]">GSTIN: {invoice.vendorGstin}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#4B4C51] dark:text-[#7E7E7E] uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Amount & Dates
                </span>
                <p className="text-lg font-black text-[#2E2E2D] dark:text-[#F3DDB6]">{formatCurrency(invoice.totalAmount)}</p>
                <p className="text-xs text-[#4B4C51] dark:text-[#7E7E7E]">Issued: {invoice.invoiceDate}</p>
              </div>
            </div>

            {/* AI Risk Score Bar */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <ShieldAlert className="w-4 h-4 text-[#8D9797]" />
                  AI Risk Engine Score
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">{invoice.riskScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    invoice.riskScore >= 90
                      ? 'bg-red-600'
                      : invoice.riskScore >= 70
                      ? 'bg-orange-500'
                      : invoice.riskScore >= 35
                      ? 'bg-yellow-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${invoice.riskScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                OCR Confidence: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{invoice.ocrConfidence}%</span>
              </p>
            </div>

            {/* AI Risk Flags Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Detected Anomaly Flags ({invoice.riskFlags.length})
              </h4>
              {invoice.riskFlags.length === 0 ? (
                <div className="p-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> No anomalies flagged for this invoice.
                </div>
              ) : (
                invoice.riskFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileWarning className="w-4 h-4 text-amber-500 dark:text-amber-400" /> {flag.title}
                      </span>
                      <Badge type="risk" value={flag.severity} size="sm" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{flag.description}</p>
                    <div className="p-2 rounded-lg bg-amber-500/5 dark:bg-amber-400/10 text-[11px] font-mono text-amber-700 dark:text-amber-300">
                      💡 AI Analysis: {flag.aiExplanation}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Line Items Sample */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Extracted Line Items ({invoice.lineItems.length})
              </h4>
              <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-[#121215] font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">HSN</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {invoice.lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="p-2.5 font-medium text-slate-900 dark:text-white">{item.description}</td>
                        <td className="p-2.5 font-mono text-slate-500 dark:text-slate-400">{item.hsnCode}</td>
                        <td className="p-2.5 text-right text-slate-700 dark:text-slate-300">{item.quantity}</td>
                        <td className="p-2.5 text-right font-bold text-slate-950 dark:text-white">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121215] flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ExternalLink className="w-4 h-4" />}
              onClick={() => {
                onClose();
                navigate(`/invoices/${invoice.id}`);
              }}
            >
              Full Inspection
            </Button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('FLAGGED')}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors border border-amber-500/30 flex items-center gap-1"
              >
                <FileWarning className="w-3.5 h-3.5" /> Flag
              </button>
              <button
                onClick={() => handleAction('REJECTED')}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition-colors border border-rose-500/30 flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button
                onClick={() => handleAction('APPROVED')}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
