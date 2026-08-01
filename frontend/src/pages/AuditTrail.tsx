import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/atoms/Card';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { History, ShieldCheck, Search } from 'lucide-react';
import { Input } from '../components/atoms/Input';
import { Select } from '../components/atoms/Select';

export const AuditTrailPage: React.FC = () => {
  const { invoices } = useInvoiceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const allLogs = invoices.flatMap((inv) =>
    inv.auditLogs.map((log) => ({
      ...log,
      invoiceNumber: inv.invoiceNumber,
    }))
  );

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch =
      log.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout title="Audit Event Trajectory Log">
      <Card variant="glass" className="space-y-6 border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              Immutable Audit Logs
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
              Cryptographically verified event trajectory for AI risk decisions
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-yellow-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>SOC2 & ISO 27001 Compliant</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search by invoice #, auditor, or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'SUCCESS', label: 'Passed / Verified' },
              { value: 'WARNING', label: 'Warning Flags' },
              { value: 'ERROR', label: 'Critical Anomalies' },
            ]}
          />
        </div>

        {/* Log Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-zinc-900 border-b border-slate-300 dark:border-zinc-800 font-black text-slate-950 dark:text-zinc-200 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Audit Details</th>
                <th className="py-3 px-4 text-center">Result Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/80 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-zinc-400 font-bold">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-zinc-400">{log.timestamp}</td>
                    <td className="py-3 px-4 font-black text-slate-950 dark:text-yellow-400">{log.invoiceNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-950 dark:text-zinc-200">{log.actor} ({log.role})</td>
                    <td className="py-3 px-4 font-extrabold text-slate-950 dark:text-zinc-100">{log.action}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-zinc-300 max-w-xs truncate">{log.details}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            : log.status === 'ERROR'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-yellow-400 border-amber-500/30'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
};
