import React from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Invoice } from '../../types/invoice';
import { FileText, Hash, Calendar, DollarSign, Building } from 'lucide-react';

export interface ExtractedDataPanelProps {
  invoice: Invoice;
}

export const ExtractedDataPanel: React.FC<ExtractedDataPanelProps> = ({ invoice }) => {
  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt);
  };

  return (
    <div className="space-y-6">
      <Card variant="glass" className="space-y-6 border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Extracted OCR Fields & Tax Validation
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">Multi-modal AI vision extracted parameters</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge type="status" value={invoice.status} />
            <Badge type="risk" value={invoice.riskLevel} />
          </div>
        </div>

        {/* Primary Invoice Header Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400">
              <Hash className="w-3.5 h-3.5 text-amber-500" />
              <span>Invoice Number</span>
            </div>
            <p className="text-sm font-black text-slate-950 dark:text-white mt-1">{invoice.invoiceNumber}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Invoice Date</span>
            </div>
            <p className="text-sm font-black text-slate-950 dark:text-white mt-1">{invoice.invoiceDate}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400">
              <Building className="w-3.5 h-3.5 text-amber-500" />
              <span>Vendor GSTIN</span>
            </div>
            <p className="text-sm font-mono font-black text-slate-950 dark:text-white mt-1">{invoice.vendorGstin}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-400">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              <span>Total Amount</span>
            </div>
            <p className="text-sm font-black text-amber-600 dark:text-yellow-400 mt-1">{formatCurrency(invoice.totalAmount)}</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-950 dark:text-zinc-200 uppercase tracking-wider">Itemized Line Items</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-900 border-b border-slate-300 dark:border-zinc-800 font-black text-slate-950 dark:text-zinc-200 uppercase">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">HSN/SAC</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-center">GST Rate</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80 font-medium">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-950 dark:text-zinc-100">{item.description}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-zinc-400">{item.hsnCode}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-950 dark:text-zinc-200">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-slate-950 dark:text-zinc-200">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-yellow-400">{item.gstRate}%</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-950 dark:text-white">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tax Summary Breakout */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500 dark:text-zinc-400 block font-semibold">Subtotal:</span>
              <span className="font-extrabold text-slate-950 dark:text-zinc-200 text-sm">{formatCurrency(invoice.subtotalAmount)}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-400 block font-semibold">CGST (9%):</span>
              <span className="font-extrabold text-slate-950 dark:text-zinc-200 text-sm">{formatCurrency(invoice.gstAmount / 2)}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-400 block font-semibold">SGST (9%):</span>
              <span className="font-extrabold text-slate-950 dark:text-zinc-200 text-sm">{formatCurrency(invoice.gstAmount / 2)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-500 dark:text-zinc-400 block font-semibold">Grand Total:</span>
            <span className="font-black text-amber-600 dark:text-yellow-400 text-base">{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
