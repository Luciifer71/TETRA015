import { Invoice, DashboardSummary, VendorStat, RiskDistribution } from '../types/invoice';

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-001',
    invoiceNumber: 'INV/2026/8942',
    vendorName: 'Acme Cloud Solutions Ltd',
    vendorGstin: '27AAACA12341Z5',
    poNumber: 'PO-99401',
    invoiceDate: '2026-07-28',
    dueDate: '2026-08-28',
    subtotalAmount: 450000,
    gstAmount: 81000,
    totalAmount: 531000,
    currency: 'INR',
    riskScore: 88,
    riskLevel: 'HIGH',
    status: 'FLAGGED',
    ocrConfidence: 97.4,
    lineItems: [
      { id: '1', description: 'Enterprise Cloud Infrastructure - July 2026', hsnCode: '998315', quantity: 1, unitPrice: 350000, amount: 350000, gstRate: 18 },
      { id: '2', description: 'Managed Security Services Addon', hsnCode: '998316', quantity: 1, unitPrice: 100000, amount: 100000, gstRate: 18 }
    ],
    riskFlags: [
      {
        id: 'rf-1',
        code: 'DUPLICATE_NUMBER',
        title: 'Potential Duplicate Invoice Number',
        description: 'Invoice number INV/2026/8942 matches previously submitted invoice from June 2026.',
        severity: 'HIGH',
        confidence: 99.2,
        aiExplanation: 'The invoice number and vendor match an entry processed on 2026-06-15. Check if this is a double billing scenario.'
      },
      {
        id: 'rf-2',
        code: 'AMOUNT_MISMATCH',
        title: 'PO Amount Mismatch (+18%)',
        description: 'Billed amount ₹5,31,000 exceeds Purchase Order PO-99401 limit of ₹4,50,000.',
        severity: 'MEDIUM',
        confidence: 94.0,
        aiExplanation: 'Line item 2 (Managed Security Services) was not present in original approved PO.'
      }
    ],
    auditLogs: [
      { id: 'al-1', timestamp: '2026-07-28 10:14:00', actor: 'AI OCR Pipeline', role: 'System', action: 'Data Extraction', details: 'Extracted 12 fields with 97.4% confidence', status: 'SUCCESS' },
      { id: 'al-2', timestamp: '2026-07-28 10:14:05', actor: 'Risk Intelligence Engine', role: 'System', action: 'Risk Scoring', details: 'Calculated risk score 88/100 [HIGH RISK]', status: 'WARNING' }
    ],
    authenticityReport: {
      forgeryScore: 82,
      verdict: 'FORGED',
      summary: 'Digital manipulation detected: Total amount & line item text layers were altered using PDF editing software post-generation.',
      tamperedFields: ['Total Amount Field', 'Line Item 2 Description', 'GST Rate Layer'],
      forensicChecks: {
        fontConsistency: { name: 'Font & Typography Layer', passed: false, details: 'Secondary font embedding (Helvetica-Bold) detected only in total amount field.' },
        metadataIntegrity: { name: 'PDF Metadata & History', passed: false, details: 'Document edited in Adobe Acrobat Pro 2024 after initial PDF export.' },
        pixelCompression: { name: 'Compression Artifact Inspection', passed: true, details: 'No pixel manipulation or clone tool artifacts detected.' },
        alignmentGrid: { name: 'Spatial & Grid Alignment', passed: false, details: 'Total amount text box displaced vertically by 3.2px from baseline grid.' },
        logoSignature: { name: 'Logo & Signature Forensics', passed: true, details: 'Vendor logo vector curves & signature integrity verified.' },
      },
    },
  },
  {
    id: 'INV-2026-002',
    invoiceNumber: 'TAX-9021',
    vendorName: 'Bharat Hardware & Logistics',
    vendorGstin: '07BBBCC98762Z1',
    poNumber: 'PO-88210',
    invoiceDate: '2026-07-30',
    dueDate: '2026-08-15',
    subtotalAmount: 120000,
    gstAmount: 21600,
    totalAmount: 141600,
    currency: 'INR',
    riskScore: 12,
    riskLevel: 'LOW',
    status: 'APPROVED',
    ocrConfidence: 99.1,
    lineItems: [
      { id: '1', description: 'Server Rack Enclosures 42U', hsnCode: '853810', quantity: 2, unitPrice: 60000, amount: 120000, gstRate: 18 }
    ],
    riskFlags: [],
    auditLogs: [
      { id: 'al-3', timestamp: '2026-07-30 14:02:11', actor: 'AI OCR Pipeline', role: 'System', action: 'Data Extraction', details: 'Extracted fields with 99.1% confidence', status: 'SUCCESS' },
      { id: 'al-4', timestamp: '2026-07-30 14:05:00', actor: 'Priya Sharma', role: 'Senior Audit Manager', action: 'Manual Approval', details: 'Verified against PO and approved payment', status: 'SUCCESS' }
    ]
  },
  {
    id: 'INV-2026-003',
    invoiceNumber: 'CONS/26/044',
    vendorName: 'Nexus Management Consultants',
    vendorGstin: '29ABCDE56783Z9',
    poNumber: 'PO-77412',
    invoiceDate: '2026-07-29',
    dueDate: '2026-08-29',
    subtotalAmount: 850000,
    gstAmount: 153000,
    totalAmount: 1003000,
    currency: 'INR',
    riskScore: 94,
    riskLevel: 'CRITICAL',
    status: 'FLAGGED',
    ocrConfidence: 92.0,
    lineItems: [
      { id: '1', description: 'Strategic Financial Advisory - Q2', hsnCode: '998311', quantity: 1, unitPrice: 850000, amount: 850000, gstRate: 18 }
    ],
    riskFlags: [
      {
        id: 'rf-3',
        code: 'INVALID_GSTIN',
        title: 'GSTIN Inactive / Filing Default',
        description: 'Vendor GSTIN 29ABCDE56783Z9 shows default status on GSTN portal as of July 2026.',
        severity: 'CRITICAL',
        confidence: 99.9,
        aiExplanation: 'Tax credit eligibility is compromised. Input tax credit (ITC) claim will be rejected by tax authority.'
      },
      {
        id: 'rf-4',
        code: 'ROUND_NUMBER_ANOMALY',
        title: 'Round Amount Anomaly',
        description: 'Subtotal is an exact round figure ₹8,50,000 without itemized deliverable breakdown.',
        severity: 'MEDIUM',
        confidence: 89.0,
        aiExplanation: 'Unusual round figure for consulting deliverables without timesheet backup.'
      }
    ],
    auditLogs: [
      { id: 'al-5', timestamp: '2026-07-29 16:20:10', actor: 'AI OCR Pipeline', role: 'System', action: 'Data Extraction', details: 'Extracted fields with 92.0% confidence', status: 'SUCCESS' },
      { id: 'al-6', timestamp: '2026-07-29 16:20:15', actor: 'GST Validation Service', role: 'API', action: 'Tax Audit', details: 'GSTIN status verification failed', status: 'ERROR' }
    ]
  },
  {
    id: 'INV-2026-004',
    invoiceNumber: 'SW-98124',
    vendorName: 'Global Softworks Technologies',
    vendorGstin: '33FGHIJ12344Z2',
    poNumber: 'PO-99105',
    invoiceDate: '2026-07-25',
    dueDate: '2026-08-25',
    subtotalAmount: 290000,
    gstAmount: 52200,
    totalAmount: 342200,
    currency: 'INR',
    riskScore: 45,
    riskLevel: 'MEDIUM',
    status: 'PROCESSED',
    ocrConfidence: 98.5,
    lineItems: [
      { id: '1', description: 'Enterprise Developer Licenses (15 seats)', hsnCode: '997331', quantity: 15, unitPrice: 19333.33, amount: 290000, gstRate: 18 }
    ],
    riskFlags: [
      {
        id: 'rf-5',
        code: 'PRICE_VARIANCE',
        title: 'Unit Price Variance (+12%)',
        description: 'Per seat cost ₹19,333 is 12% higher than historical average of ₹17,250.',
        severity: 'MEDIUM',
        confidence: 88.0,
        aiExplanation: 'Vendor increased license pricing without prior rate card revision notice.'
      }
    ],
    auditLogs: [
      { id: 'al-7', timestamp: '2026-07-25 11:10:00', actor: 'AI OCR Pipeline', role: 'System', action: 'Data Extraction', details: 'Extracted fields successfully', status: 'SUCCESS' }
    ]
  },
  {
    id: 'INV-2026-005',
    invoiceNumber: 'LOG/2026/099',
    vendorName: 'SwiftExpress Supply Chain Ltd',
    vendorGstin: '06KLMNO43215Z7',
    poNumber: 'PO-66231',
    invoiceDate: '2026-07-31',
    dueDate: '2026-08-30',
    subtotalAmount: 78000,
    gstAmount: 14040,
    totalAmount: 92040,
    currency: 'INR',
    riskScore: 8,
    riskLevel: 'LOW',
    status: 'APPROVED',
    ocrConfidence: 99.5,
    lineItems: [
      { id: '1', description: 'Intra-city Freight & Haulage - July', hsnCode: '996511', quantity: 1, unitPrice: 78000, amount: 78000, gstRate: 18 }
    ],
    riskFlags: [],
    auditLogs: [
      { id: 'al-8', timestamp: '2026-07-31 09:00:00', actor: 'AI OCR Pipeline', role: 'System', action: 'Data Extraction', details: 'Extracted 10 fields cleanly', status: 'SUCCESS' }
    ]
  }
];

export const INITIAL_SUMMARY: DashboardSummary = {
  totalAudited: 1248,
  totalAmountProcessed: 48950000,
  highRiskCount: 38,
  pendingReviewCount: 14,
  timeSavedHours: 320,
  accuracyRate: 97.8
};

export const INITIAL_VENDOR_STATS: VendorStat[] = [
  { vendorName: 'Acme Cloud Solutions Ltd', invoiceCount: 24, totalSpend: 12700000, riskScore: 78, status: 'CAUTION' },
  { vendorName: 'Bharat Hardware & Logistics', invoiceCount: 42, totalSpend: 8400000, riskScore: 12, status: 'VERIFIED' },
  { vendorName: 'Nexus Management Consultants', invoiceCount: 6, totalSpend: 6100000, riskScore: 94, status: 'SUSPECT' },
  { vendorName: 'Global Softworks Tech', invoiceCount: 18, totalSpend: 5200000, riskScore: 45, status: 'VERIFIED' },
  { vendorName: 'SwiftExpress Supply Chain', invoiceCount: 56, totalSpend: 4300000, riskScore: 8, status: 'VERIFIED' }
];

export const INITIAL_RISK_DISTRIBUTION: RiskDistribution[] = [
  { name: 'Low Risk (0-30)', value: 840, color: '#10B981' },
  { name: 'Medium Risk (31-70)', value: 370, color: '#EAB308' },
  { name: 'High Risk (71-90)', value: 32, color: '#F97316' },
  { name: 'Critical Risk (91-100)', value: 6, color: '#FF1744' }
];
