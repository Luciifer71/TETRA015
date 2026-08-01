import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/atoms/Card';
import { FileDropzone } from '../components/molecules/FileDropzone';
import { Sparkles, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppLayout title="Invoice AI Upload & OCR Risk Audit">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card variant="glass" className="space-y-6 border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Upload Invoice for Automated AI Audit
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                Supports PDF, PNG, JPG formats up to 25MB. Instant OCR extraction & anomaly detection.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-yellow-400 text-xs font-bold shrink-0">
              <ShieldCheck className="w-4 h-4" />
              <span>Real-time Risk Engine</span>
            </div>
          </div>

          {/* Interactive OCR Dropzone */}
          <FileDropzone onComplete={() => navigate('/invoices')} />

          {/* Supported Format Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-zinc-800 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
              <span className="font-extrabold text-slate-950 dark:text-white block">Multi-Modal Vision</span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Extracts line items & GSTIN numbers</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
              <span className="font-extrabold text-slate-950 dark:text-white block">Anomaly Detection</span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Detects price variance & duplicate bills</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
              <span className="font-extrabold text-slate-950 dark:text-white block">GSTN Sync Verification</span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Checks filing active status</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
