import React from 'react';
import { Card } from '../atoms/Card';
import { AuditLogEntry } from '../../types/invoice';
import { Clock, User, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AuditTimeline: React.FC<{ logs: AuditLogEntry[] }> = ({ logs }) => {
  return (
    <Card variant="glass">
      <h3 className="text-base font-extrabold text-slate-100 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-400" />
        <span>Compliance Audit Trail</span>
      </h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {logs.map((log) => (
          <div key={log.id} className="relative flex items-start gap-4">
            <div className="absolute -left-[23px] top-1 flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 border border-slate-700">
              {log.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>

            <div className="flex-1 bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-400" />
                  {log.actor} ({log.role})
                </span>
                <span className="font-mono text-[11px] text-slate-500">{log.timestamp}</span>
              </div>
              <p className="font-bold text-slate-100">{log.action}</p>
              <p className="text-slate-300">{log.details}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
