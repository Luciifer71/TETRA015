import { describe, it, expect, beforeEach } from 'vitest';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { Invoice } from '../types/invoice';

describe('useInvoiceStore', () => {
  beforeEach(() => {
    useInvoiceStore.setState({
      invoices: [],
      summary: {
        totalAudited: 0,
        totalAmountProcessed: 0,
        highRiskCount: 0,
        pendingReviewCount: 0,
        timeSavedHours: 0,
        accuracyRate: 100,
      },
    });
  });

  it('adds new invoice and updates summary metrics', () => {
    const mockInv: Invoice = {
      id: 'INV-TEST-1',
      invoiceNumber: 'INV/2026/001',
      vendorName: 'Test Vendor',
      vendorGstin: '27AAAAA0000A1Z5',
      invoiceDate: '2026-08-01',
      dueDate: '2026-08-30',
      subtotalAmount: 100000,
      gstAmount: 18000,
      totalAmount: 118000,
      currency: 'INR',
      riskScore: 85,
      riskLevel: 'HIGH',
      status: 'FLAGGED',
      ocrConfidence: 98,
      lineItems: [],
      riskFlags: [],
      auditLogs: [],
    };

    useInvoiceStore.getState().addInvoice(mockInv);

    const state = useInvoiceStore.getState();
    expect(state.invoices).toHaveLength(1);
    expect(state.summary.totalAudited).toBe(1);
    expect(state.summary.totalAmountProcessed).toBe(118000);
    expect(state.summary.highRiskCount).toBe(1);
  });

  it('updates invoice status to APPROVED', () => {
    const mockInv: Invoice = {
      id: 'INV-TEST-2',
      invoiceNumber: 'INV/2026/002',
      vendorName: 'Test Vendor 2',
      vendorGstin: '27AAAAA0000A1Z5',
      invoiceDate: '2026-08-01',
      dueDate: '2026-08-30',
      subtotalAmount: 50000,
      gstAmount: 9000,
      totalAmount: 59000,
      currency: 'INR',
      riskScore: 10,
      riskLevel: 'LOW',
      status: 'PROCESSED',
      ocrConfidence: 99,
      lineItems: [],
      riskFlags: [],
      auditLogs: [],
    };

    useInvoiceStore.getState().addInvoice(mockInv);
    useInvoiceStore.getState().approveInvoice('INV-TEST-2');

    const updated = useInvoiceStore.getState().invoices.find((i) => i.id === 'INV-TEST-2');
    expect(updated?.status).toBe('APPROVED');
    expect(updated?.auditLogs.length).toBeGreaterThan(0);
  });
});
