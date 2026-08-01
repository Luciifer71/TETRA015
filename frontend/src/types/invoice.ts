export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type InvoiceStatus = 'PENDING' | 'PROCESSED' | 'FLAGGED' | 'APPROVED' | 'REJECTED';

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
