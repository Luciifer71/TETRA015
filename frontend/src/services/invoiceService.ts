import api from './api';

export interface Invoice {
  id: string;
  invoice_number: string;
  vendor_name: string;
  vendor_gst?: string;
  invoice_date: string;
  due_date?: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
  uploaded_at: string;
  processed_at?: string;
}

export interface RiskReport {
  id: string;
  invoice_id: string;
  risk_score: number;
  risk_level: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_factors: any[];
  recommendations: string[];
}

export interface AuditTrail {
  id: string;
  invoice_id: string;
  action: string;
  details: any;
  performed_by: string;
  created_at: string;
}

export interface Exception {
  id: string;
  invoice_id: string;
  exception_type: string;
  description: string;
  severity: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function getInvoices(skip = 0, limit = 25, filters = {}) {
  try {
    const response = await api.get('/invoices', {
      params: { skip, limit, ...filters }
    });
    return {
      success: true,
      data: response.data?.data || response.data || []
    };
  } catch (error) {
    console.error('getInvoices error:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch invoices'
    };
  }
}

export async function getInvoiceDetail(invoiceId: string) {
  try {
    const response = await api.get(`/invoices/${invoiceId}`);
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('getInvoiceDetail error:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to fetch invoice'
    };
  }
}

export async function updateInvoice(invoiceId: string, updates: any) {
  try {
    const response = await api.patch(`/invoices/${invoiceId}`, updates);
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('updateInvoice error:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to update invoice'
    };
  }
}

export async function deleteInvoice(invoiceId: string) {
  try {
    const response = await api.delete(`/invoices/${invoiceId}`);
    return {
      success: true,
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error('deleteInvoice error:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to delete invoice'
    };
  }
}

export async function searchInvoices(query: string, filters = {}) {
  try {
    const response = await api.post('/search', {
      query,
      filters,
      skip: 0,
      limit: 50
    });
    return {
      success: true,
      data: response.data?.data || response.data || []
    };
  } catch (error) {
    console.error('searchInvoices error:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to search invoices'
    };
  }
}
