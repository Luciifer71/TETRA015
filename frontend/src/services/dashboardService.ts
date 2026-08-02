import api from './api';

export interface DashboardSummary {
  total_invoices: number;
  processed: number;
  pending: number;
  flagged: number;
  approved: number;
  total_amount: number;
  risk_distribution: {
    MINIMAL: number;
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
}

export interface RecentInvoice {
  id: string;
  invoice_number: string;
  vendor_name: string;
  total_amount: number;
  status: string;
  uploaded_at: string;
}

export interface VendorStat {
  name: string;
  count: number;
  total_amount: number;
  processed: number;
  pending: number;
}

export interface RiskBreakdown {
  MINIMAL: number;
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
  try {
    const response = await api.get('/dashboard/summary');
    return {
      success: response.data?.success !== false,
      data: response.data?.data || response.data,
      message: response.data?.message
    };
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    return {
      success: false,
      data: {
        total_invoices: 0,
        processed: 0,
        pending: 0,
        flagged: 0,
        approved: 0,
        total_amount: 0,
        risk_distribution: { MINIMAL: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
      },
      message: error instanceof Error ? error.message : 'Failed to fetch dashboard summary'
    };
  }
}

export async function getRecentInvoices(): Promise<ApiResponse<RecentInvoice[]>> {
  try {
    const response = await api.get('/dashboard/recent-invoices');
    const data = response.data?.data || response.data || [];
    return {
      success: response.data?.success !== false,
      data: Array.isArray(data) ? data : [],
      message: response.data?.message
    };
  } catch (error) {
    console.error('getRecentInvoices error:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch recent invoices'
    };
  }
}

export async function getRiskDistribution(): Promise<ApiResponse<RiskBreakdown>> {
  try {
    const response = await api.get('/dashboard/risk-distribution');
    return {
      success: response.data?.success !== false,
      data: response.data?.data || response.data,
      message: response.data?.message
    };
  } catch (error) {
    console.error('getRiskDistribution error:', error);
    return {
      success: false,
      data: { MINIMAL: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      message: error instanceof Error ? error.message : 'Failed to fetch risk distribution'
    };
  }
}

export async function getVendorStats(): Promise<ApiResponse<{ top_vendors: VendorStat[]; total_unique_vendors: number }>> {
  try {
    const response = await api.get('/dashboard/vendor-stats');
    return {
      success: response.data?.success !== false,
      data: response.data?.data || response.data,
      message: response.data?.message
    };
  } catch (error) {
    console.error('getVendorStats error:', error);
    return {
      success: false,
      data: { top_vendors: [], total_unique_vendors: 0 },
      message: error instanceof Error ? error.message : 'Failed to fetch vendor stats'
    };
  }
}

export async function getHighRiskInvoices(): Promise<ApiResponse<any[]>> {
  try {
    const response = await api.get('/dashboard/high-risk-invoices');
    const data = response.data?.data || response.data || [];
    return {
      success: response.data?.success !== false,
      data: Array.isArray(data) ? data : [],
      message: response.data?.message
    };
  } catch (error) {
    console.error('getHighRiskInvoices error:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch high-risk invoices'
    };
  }
}
