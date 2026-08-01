import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { processInvoiceUpload, ScanProgress } from '../../services/ocrSimulator';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { toast } from 'sonner';

export const FileDropzone: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addInvoice = useInvoiceStore((s) => s.addInvoice);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    setIsProcessing(true);
    try {
      const extractedInvoice = await processInvoiceUpload(file, (prog) => {
        setProgress(prog);
      });
      addInvoice(extractedInvoice);
      toast.success(`Successfully audited ${file.name}! Risk Score: ${extractedInvoice.riskScore}`);
      onComplete?.();
    } catch (err) {
      toast.error('Failed to extract invoice data. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-amber-500 bg-amber-500/10 shadow-lg'
            : 'border-slate-300 dark:border-slate-700 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-900/60 dark:hover:bg-slate-900/80 hover:border-slate-400 dark:hover:border-slate-600'
        } ${isProcessing ? 'pointer-events-none opacity-90' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {isProcessing && progress ? (
          <div className="flex flex-col items-center justify-center w-full max-w-md py-4">
            <div className="p-4 bg-amber-500/15 text-amber-600 dark:text-yellow-400 rounded-full animate-pulse mb-3">
              <FileText className="w-8 h-8" />
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{progress.message}</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 mt-2">{progress.progress}% Completed</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-amber-500/15 text-amber-600 dark:text-yellow-400 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-black text-slate-950 dark:text-white tracking-tight">Drag & Drop Invoice Files</h4>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1.5 max-w-sm leading-relaxed">
              Supports PDF, PNG, JPEG formats up to 25MB. AI Vision automatically extracts fields & performs risk audit.
            </p>
            <div className="mt-4">
              <Button size="sm" variant="secondary" className="font-extrabold px-5 py-2 shadow-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                Browse Files
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
