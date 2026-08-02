import React, { useState, useRef } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { Button } from '../atoms/Button';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { toast } from 'sonner';
import { apiClient, UploadDetailResponse } from '../../services/api';
import { Invoice, RiskLevel } from '../../types/invoice';

interface ScanProgress {
  step: number;
  totalSteps: number;
  message: string;
  progress: number;
}

const buildInvoiceFromUpload = (detail: UploadDetailResponse): Invoice => {
  const extracted = detail.extracted_data || {
    invoice_number: detail.original_filename || detail.id,
    vendor_name: 'Unknown Vendor',
    vendor_gstin: '',
    invoice_date: detail.uploaded_at,
    due_date: detail.processed_at || detail.uploaded_at,
    po_number: '',
    total_amount: 0,
    tax_amount: 0,
    currency: 'INR',
    line_items: [],
  };

  const riskLevel = (detail.risk_level || 'LOW') as RiskLevel;
  const riskScore = detail.risk_score || 0;
  const confidence = Number(((detail.confidence_scores?.overall || 0) * 100).toFixed(1));
  const validationErrors = detail.validation_errors || [];

  return {
    id: detail.invoice_id || detail.id,
    invoiceNumber: extracted.invoice_number || detail.id,
    vendorName: extracted.vendor_name || 'Unknown Vendor',
    vendorGstin: extracted.vendor_gstin || '',
    poNumber: extracted.po_number || '',
    invoiceDate: extracted.invoice_date || detail.uploaded_at,
    dueDate: extracted.due_date || extracted.invoice_date || detail.uploaded_at,
    subtotalAmount: (extracted.total_amount || 0) - (extracted.tax_amount || 0),
    gstAmount: extracted.tax_amount || 0,
    totalAmount: extracted.total_amount || 0,
    currency: extracted.currency || 'INR',
    riskScore,
    riskLevel,
    status: riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? 'FLAGGED' : 'PROCESSED',
    ocrConfidence: confidence,
    lineItems: (extracted.line_items || []).map((item, index) => ({
      id: `line-${index + 1}`,
      description: item.description || `Item ${index + 1}`,
      hsnCode: (item as any).hsn_code || '',
      quantity: item.quantity || 0,
      unitPrice: item.unit_price || 0,
      amount: item.amount || 0,
      gstRate: (item as any).gst_rate || 0,
    })),
    riskFlags: validationErrors.map((error, index) => ({
      id: `risk-${index + 1}`,
      code: error.code || 'VALIDATION_ERROR',
      title: error.message || 'Validation issue detected',
      description: error.message || 'Validation issue detected',
      severity: riskLevel,
      confidence,
      aiExplanation: error.message || 'Validation issue detected during invoice processing.',
    })),
    auditLogs: [
      {
        id: `audit-${detail.id}-1`,
        timestamp: detail.uploaded_at,
        actor: 'FastAPI Pipeline',
        role: 'System',
        action: 'Invoice Extraction',
        details: `Processed ${detail.original_filename || detail.id}`,
        status: 'SUCCESS',
      },
    ],
  };
};

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
      setProgress({ step: 1, totalSteps: 4, message: `Uploading ${file.name}...`, progress: 20 });
      const uploadResponse = await apiClient.uploadInvoice(file, (prog) => {
        setProgress({
          step: 1,
          totalSteps: 4,
          message: `Uploading ${file.name}...`,
          progress: Math.min(Math.round(prog.percentage * 0.4), 40),
        });
      });

      setProgress({ step: 2, totalSteps: 4, message: 'Running extraction and validation...', progress: 55 });
      const uploadId = uploadResponse.data.invoice_id;
      const detail = await apiClient.pollUploadStatus(uploadId);

      setProgress({ step: 3, totalSteps: 4, message: 'Building risk report and syncing records...', progress: 85 });
      const extractedInvoice = buildInvoiceFromUpload(detail);
      setProgress({ step: 4, totalSteps: 4, message: 'Finalizing invoice audit...', progress: 100 });

      addInvoice(extractedInvoice);
      toast.success(`Successfully audited ${file.name}! Risk Score: ${extractedInvoice.riskScore}`);
      onComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract invoice data. Please try again.';
      toast.error(message);
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
