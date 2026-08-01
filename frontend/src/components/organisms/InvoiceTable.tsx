import React, { useState } from 'react';
import { Invoice } from '../../types/invoice';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Eye, Check, AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useNavigate } from 'react-router-dom';

export interface InvoiceTableProps {
  invoices: Invoice[];
  pageSize?: number;
  onQuickInspect?: (invoice: Invoice) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, pageSize = 8, onQuickInspect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Invoice>('invoiceDate');
  const [sortAsc, setSortAsc] = useState(false);
  const { selectInvoice, approveInvoice, flagInvoice } = useInvoiceStore();
  const navigate = useNavigate();

  const handleSort = (field: keyof Invoice) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortAsc
        ? (valA as string).localeCompare(valB as string)
        : (valB as string).localeCompare(valA as string);
    }
    if (typeof valA === 'number') {
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedInvoices.length / pageSize) || 1;
  const paginated = sortedInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  };

  return (
    <div className="flex flex-col w-full bg-white dark:bg-[#1c1c22] backdrop-blur-xl border border-[#D0D0D2] dark:border-[#8D9797]/25 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#F3F3F3] dark:bg-[#121215] border-b border-[#D0D0D2] dark:border-white/10 text-xs font-bold text-[#2E2E2D] dark:text-[#F3DDB6] uppercase tracking-wider select-none">
              <th className="py-4 px-6 cursor-pointer hover:text-[#2E2E2D] dark:hover:text-[#F3DDB6]" onClick={() => handleSort('invoiceNumber')}>
                <div className="flex items-center gap-1.5">
                  <span>Invoice #</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                </div>
              </th>
              <th className="py-4 px-6 cursor-pointer hover:text-[#2E2E2D] dark:hover:text-[#F3DDB6]" onClick={() => handleSort('vendorName')}>
                <div className="flex items-center gap-1.5">
                  <span>Vendor</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                </div>
              </th>
              <th className="py-4 px-6 cursor-pointer hover:text-[#2E2E2D] dark:hover:text-[#F3DDB6] text-right" onClick={() => handleSort('totalAmount')}>
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Amount</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                </div>
              </th>
              <th className="py-4 px-6 cursor-pointer hover:text-[#2E2E2D] dark:hover:text-[#F3DDB6] text-center" onClick={() => handleSort('riskScore')}>
                <div className="flex items-center justify-center gap-1.5">
                  <span>Risk Score</span>
                  <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                </div>
              </th>
              <th className="py-4 px-6 text-center">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D0D0D2]/50 dark:divide-white/10 bg-white dark:bg-[#1c1c22]">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#4B4C51] dark:text-[#7E7E7E] font-bold">
                  No matching invoices found.
                </td>
              </tr>
            ) : (
              paginated.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-[#BCBCBE]/15 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => {
                    if (onQuickInspect) {
                      onQuickInspect(inv);
                    } else {
                      selectInvoice(inv);
                      navigate(`/invoices/${inv.id}`);
                    }
                  }}
                >
                  <td className="py-4 px-6 font-bold text-[#2E2E2D] dark:text-[#F3DDB6] group-hover:text-[#4B4C51] dark:group-hover:text-[#F3DDB6]">
                    {inv.invoiceNumber}
                    <div className="text-[11px] font-normal text-[#4B4C51] dark:text-[#7E7E7E]">{inv.invoiceDate}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-[#2E2E2D] dark:text-[#F3DDB6]">{inv.vendorName}</div>
                    <div className="text-[11px] font-mono font-medium text-[#4B4C51] dark:text-[#7E7E7E]">{inv.vendorGstin}</div>
                  </td>
                  <td className="py-4 px-6 text-right font-black text-[#2E2E2D] dark:text-[#F3DDB6]">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex flex-col items-center">
                      <Badge type="risk" value={inv.riskLevel} size="sm" />
                      <div className="w-20 bg-[#D0D0D2]/40 dark:bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            inv.riskScore >= 70 ? 'bg-rose-500' : inv.riskScore >= 35 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${inv.riskScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Badge type="status" value={inv.status} size="sm" />
                  </td>
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {onQuickInspect && (
                        <button
                          onClick={() => onQuickInspect(inv)}
                          title="Quick AI Risk Drawer"
                          className="p-1.5 rounded-xl bg-[#F3F3F3] dark:bg-white/5 text-[#2E2E2D] dark:text-[#F3DDB6] hover:bg-[#D0D0D2] dark:hover:bg-white/15 transition-colors border border-[#D0D0D2] dark:border-white/10 flex items-center gap-1 text-xs font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#4B4C51] dark:text-[#F3DDB6]" />
                          <span className="hidden lg:inline">Inspect</span>
                        </button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Full Details"
                        onClick={() => {
                          selectInvoice(inv);
                          navigate(`/invoices/${inv.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4 text-[#4B4C51] dark:text-[#7E7E7E] hover:text-[#2E2E2D] dark:hover:text-[#F3DDB6]" />
                      </Button>
                      {inv.status !== 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => approveInvoice(inv.id)}
                          title="Approve Invoice"
                        >
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 hover:scale-110" />
                        </Button>
                      )}
                      {inv.status !== 'FLAGGED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => flagInvoice(inv.id)}
                          title="Flag Invoice"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 hover:scale-110" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#F3F3F3] dark:bg-[#121215] border-t border-[#D0D0D2] dark:border-white/10 text-xs font-bold text-[#2E2E2D] dark:text-[#F3DDB6]">
        <span>
          Showing {paginated.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, sortedInvoices.length)} of {sortedInvoices.length} Invoices
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

