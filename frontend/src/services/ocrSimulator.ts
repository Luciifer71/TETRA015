import { Invoice, RiskLevel, InvoiceStatus } from '../types/invoice';

export interface ScanProgress {
  step: number;
  totalSteps: number;
  message: string;
  progress: number;
}

export const processInvoiceUpload = async (
  file: File,
  onProgress?: (prog: ScanProgress) => void
): Promise<Invoice> => {
  const fileName = file.name;
  
  // Step 1: Uploading
  onProgress?.({ step: 1, totalSteps: 6, message: `Uploading ${fileName}...`, progress: 15 });
  await new Promise((res) => setTimeout(res, 500));

  // Step 2: OCR Vision Extraction
  onProgress?.({ step: 2, totalSteps: 6, message: 'Extracting text and line items via AI Vision Model...', progress: 35 });
  await new Promise((res) => setTimeout(res, 650));

  // Step 3: Document Authenticity & Forensics Scan
  onProgress?.({ step: 3, totalSteps: 6, message: 'AI Authenticity Engine: Inspecting font layers, EXIF metadata & compression artifacts...', progress: 55 });
  await new Promise((res) => setTimeout(res, 750));

  // Step 4: Purchase Ledger & Vendor Verification
  onProgress?.({ step: 4, totalSteps: 6, message: 'Matching against Purchase Order & Vendor Master DB...', progress: 75 });
  await new Promise((res) => setTimeout(res, 600));

  // Step 5: Tax & GSTIN Audit
  onProgress?.({ step: 5, totalSteps: 6, message: 'Verifying GSTIN status & tax rate calculations...', progress: 90 });
  await new Promise((res) => setTimeout(res, 500));

  // Step 6: Risk Intelligence Scoring
  onProgress?.({ step: 6, totalSteps: 6, message: 'Generating risk score & authenticity report...', progress: 100 });
  await new Promise((res) => setTimeout(res, 400));

  // Generate simulated extracted invoice based on filename hints or defaults
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const isHighRisk = fileName.toLowerCase().includes('risk') || fileName.toLowerCase().includes('dubious') || Math.random() > 0.6;
  const isCritical = fileName.toLowerCase().includes('critical') || fileName.toLowerCase().includes('fraud');
  
  let riskScore = isCritical ? 95 : isHighRisk ? 82 : Math.floor(10 + Math.random() * 35);
  let riskLevel: RiskLevel = 'LOW';
  let status: InvoiceStatus = 'PROCESSED';

  if (riskScore >= 90) {
    riskLevel = 'CRITICAL';
    status = 'FLAGGED';
  } else if (riskScore >= 70) {
    riskLevel = 'HIGH';
    status = 'FLAGGED';
  } else if (riskScore >= 35) {
    riskLevel = 'MEDIUM';
    status = 'PROCESSED';
  } else {
    riskLevel = 'LOW';
    status = 'APPROVED';
  }

  const subtotal = Math.floor(50000 + Math.random() * 450000);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const createdInvoice: Invoice = {
    id: `INV-2026-${randNum}`,
    invoiceNumber: `INV/2026/${randNum}`,
    vendorName: fileName.substring(0, 15).replace(/[^a-zA-Z]/g, ' ') || 'Apex Technologies Pvt Ltd',
    vendorGstin: '27AAACG99991Z3',
    poNumber: `PO-${randNum + 10}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    subtotalAmount: subtotal,
    gstAmount: gst,
    totalAmount: total,
    currency: 'INR',
    riskScore,
    riskLevel,
    status,
    ocrConfidence: Number((95 + Math.random() * 4.5).toFixed(1)),
    lineItems: [
      {
        id: 'li-1',
        description: `Professional Services - ${file.name.substring(0, 20)}`,
        hsnCode: '998313',
        quantity: 1,
        unitPrice: subtotal,
        amount: subtotal,
        gstRate: 18
      }
    ],
    riskFlags: riskScore > 60 ? [
      {
        id: `rf-${randNum}`,
        code: 'ANOMALY_DETECTED',
        title: 'GST Tax Calculation Discrepancy',
        description: 'Billed tax rate differs slightly from HSN 998313 default classification.',
        severity: riskLevel,
        confidence: 96.0,
        aiExplanation: 'Automated AI audit detected potential variance in GST tax breakdown requiring auditor sign-off.'
      }
    ] : [],
    auditLogs: [
      {
        id: `al-${randNum}-1`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'AI OCR Pipeline',
        role: 'System',
        action: 'Batch Upload Extraction',
        details: `Successfully processed file ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        status: 'SUCCESS'
      },
      {
        id: `al-${randNum}-2`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'Authenticity Engine',
        role: 'System',
        action: 'Forensic Authenticity Audit',
        details: isHighRisk ? `Detected potential document alteration (Forgery Score: ${riskScore}%)` : 'Document verified authentic with zero font or metadata anomalies',
        status: isHighRisk ? 'WARNING' : 'SUCCESS'
      }
    ],
    authenticityReport: {
      forgeryScore: isHighRisk ? riskScore : Math.floor(2 + Math.random() * 12),
      verdict: isHighRisk ? (riskScore > 90 ? 'FORGED' : 'SUSPICIOUS') : 'AUTHENTIC',
      summary: isHighRisk
        ? 'Digital manipulation warning: Document structure or font layers indicate potential editing prior to submission.'
        : 'All 5 document forensic checks passed cleanly. No digital alteration, font layer discrepancy, or EXIF metadata modification detected.',
      tamperedFields: isHighRisk ? ['Total Amount Box', 'Font Layer Alignment'] : [],
      forensicChecks: {
        fontConsistency: { name: 'Font & Typography Layer', passed: !isHighRisk, details: isHighRisk ? 'Typography weight mismatch in billing table.' : 'Uniform font vectors verified.' },
        metadataIntegrity: { name: 'PDF Metadata & History', passed: true, details: 'Valid creation software signature.' },
        pixelCompression: { name: 'Compression Artifact Inspection', passed: true, details: 'Consistent JPEG/PDF compression map.' },
        alignmentGrid: { name: 'Spatial & Grid Alignment', passed: !isHighRisk, details: isHighRisk ? 'Minor vertical text displacement detected.' : 'Pixel baseline grid verified.' },
        logoSignature: { name: 'Logo & Signature Forensics', passed: true, details: 'Vector logo resolution verified.' },
      },
    },
  };

  return createdInvoice;
};
