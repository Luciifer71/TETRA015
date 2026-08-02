export type RiskLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type InvoiceStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FLAGGED' | 'APPROVED' | 'REJECTED' | 'FAILED';

export interface LineItem {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  gstRate: number;
}

export interface RiskFlag {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: RiskLevel;
  confidence: number;
  aiExplanation: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface ForensicCheckItem {
  name: string;
  passed: boolean;
  details: string;
}

export interface AuthenticityReport {
  forgeryScore: number; // 0 to 100
  verdict: 'AUTHENTIC' | 'SUSPICIOUS' | 'FORGED';
  summary: string;
  forensicChecks: {
    fontConsistency: ForensicCheckItem;
    metadataIntegrity: ForensicCheckItem;
    pixelCompression: ForensicCheckItem;
    alignmentGrid: ForensicCheckItem;
    logoSignature: ForensicCheckItem;
  };
  tamperedFields?: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  vendorGstin: string;
  poNumber?: string;
  invoiceDate: string;
  dueDate: string;
  subtotalAmount: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  status: InvoiceStatus;
  ocrConfidence: number; // percentage e.g. 96.5
  lineItems: LineItem[];
  riskFlags: RiskFlag[];
  auditLogs: AuditLogEntry[];
  pdfUrl?: string;
  authenticityReport?: AuthenticityReport;
}

export interface DashboardSummary {
  totalAudited: number;
  totalAmountProcessed: number;
  highRiskCount: number;
  pendingReviewCount: number;
  timeSavedHours: number;
  accuracyRate: number;
}

export interface VendorStat {
  vendorName: string;
  invoiceCount: number;
  totalSpend: number;
  riskScore: number;
  status: 'VERIFIED' | 'CAUTION' | 'SUSPECT';
}

export interface RiskDistribution {
  name: string;
  value: number;
  color: string;
}
