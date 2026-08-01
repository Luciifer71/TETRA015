import React from 'react';
import { Card } from '../atoms/Card';
import { AuthenticityReport } from '../../types/invoice';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, FileSearch, Sparkles, AlertTriangle } from 'lucide-react';

interface AuthenticityForensicsPanelProps {
  report?: AuthenticityReport;
}

export const AuthenticityForensicsPanel: React.FC<AuthenticityForensicsPanelProps> = ({ report }) => {
  if (!report) {
    return (
      <Card variant="glass" className="p-5 border border-slate-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs font-semibold">
          <FileSearch className="w-4 h-4" />
          <span>Document Forensics Scan Pending...</span>
        </div>
      </Card>
    );
  }

  const isForged = report.verdict === 'FORGED';
  const isSuspicious = report.verdict === 'SUSPICIOUS';

  const checks = [
    report.forensicChecks.fontConsistency,
    report.forensicChecks.metadataIntegrity,
    report.forensicChecks.pixelCompression,
    report.forensicChecks.alignmentGrid,
    report.forensicChecks.logoSignature,
  ];

  return (
    <Card variant="glass" className="p-6 border border-slate-200 dark:border-zinc-800 space-y-6 shadow-xl relative overflow-hidden">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-amber-500" />
              AI Document Authenticity Engine™ Forensics
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Pixel Forensics
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
            Evaluates digital alteration, font layers, EXIF metadata, and compression artifacts.
          </p>
        </div>

        {/* Score & Verdict Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Forgery Score
            </span>
            <span className={`text-2xl font-mono font-black ${isForged ? 'text-rose-600 dark:text-rose-400' : isSuspicious ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {report.forgeryScore}%
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-2xl text-xs font-black border flex items-center gap-1.5 shadow-sm ${
              isForged
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                : isSuspicious
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isForged || isSuspicious ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{report.verdict}</span>
          </div>
        </div>
      </div>

      {/* Forensic Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {checks.map((check, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border transition-all ${
              check.passed
                ? 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-200 truncate">
                {check.name}
              </span>
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
              {check.details}
            </p>
          </div>
        ))}
      </div>

      {/* Summary Box */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-xs space-y-2">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Forensics Conclusion Summary</span>
        </div>
        <p className="text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
          {report.summary}
        </p>

        {report.tamperedFields && report.tamperedFields.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2 flex-wrap">
            <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" /> Flagged Alterations:
            </span>
            {report.tamperedFields.map((field, fIdx) => (
              <span key={fIdx} className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono font-bold text-[10px]">
                {field}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
