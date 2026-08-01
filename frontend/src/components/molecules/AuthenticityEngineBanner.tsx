import React from 'react';
import { ShieldAlert, Scan, Sparkles } from 'lucide-react';

export const AuthenticityEngineBanner: React.FC = () => {
  return (
    <div className="w-full rounded-3xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white p-6 shadow-xl dark:shadow-2xl overflow-hidden relative transition-colors">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        {/* Column 1: Title & Badge */}
        <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-800 pb-4 md:pb-0 md:pr-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Forensics Tech</span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
            <Scan className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>AI Document Authenticity Engine™</span>
          </h3>
        </div>

        {/* Column 2: Core Purpose */}
        <div className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-800 pb-4 md:pb-0 md:pr-4">
          <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
            Detects whether a document has been digitally edited, manipulated, forged, or suspiciously altered before processing.
          </p>
        </div>

        {/* Column 3: Forensic Inspection Method */}
        <div className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-zinc-800 pb-4 md:pb-0 md:pr-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Uses AI vision analysis and document forensics to inspect fonts, alignment, metadata, compression artifacts, logos, signatures, arithmetic consistency, repeated pixel regions, and document structure to produce a Forgery Probability Score.
          </p>
        </div>

        {/* Column 4: Differentiator Statement */}
        <div>
          <p className="text-xs text-amber-900 dark:text-amber-200/90 font-medium italic leading-relaxed">
            Most invoice systems never inspect the document itself. They only read its contents. This feature evaluates the <span className="underline font-bold text-amber-700 dark:text-amber-400">integrity of the document</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
