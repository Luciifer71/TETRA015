import { create } from 'zustand';
import { Invoice, InvoiceStatus, DashboardSummary, VendorStat, RiskDistribution, AuditLogEntry } from '../types/invoice';
import { INITIAL_INVOICES, INITIAL_SUMMARY, INITIAL_VENDOR_STATS, INITIAL_RISK_DISTRIBUTION } from '../services/mockData';

interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  summary: DashboardSummary;
  vendorStats: VendorStat[];
  riskDistribution: RiskDistribution[];
  searchQuery: string;
  selectedRiskFilter: string;
  selectedStatusFilter: string;
  darkMode: boolean;

  // Actions
  addInvoice: (invoice: Invoice) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  selectInvoice: (invoice: Invoice | null) => void;
  setSearchQuery: (query: string) => void;
  setRiskFilter: (filter: string) => void;
  setStatusFilter: (filter: string) => void;
  toggleDarkMode: () => void;
  approveInvoice: (id: string) => void;
  flagInvoice: (id: string) => void;
  rejectInvoice: (id: string) => void;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: INITIAL_INVOICES,
  selectedInvoice: INITIAL_INVOICES[0],
  summary: INITIAL_SUMMARY,
  vendorStats: INITIAL_VENDOR_STATS,
  riskDistribution: INITIAL_RISK_DISTRIBUTION,
  searchQuery: '',
  selectedRiskFilter: 'ALL',
  selectedStatusFilter: 'ALL',
  darkMode: false,

  addInvoice: (newInv) =>
    set((state) => {
      const updated = [newInv, ...state.invoices];
      const isHigh = newInv.riskLevel === 'HIGH' || newInv.riskLevel === 'CRITICAL';
      const newSummary = {
        ...state.summary,
        totalAudited: state.summary.totalAudited + 1,
        totalAmountProcessed: state.summary.totalAmountProcessed + newInv.totalAmount,
        highRiskCount: state.summary.highRiskCount + (isHigh ? 1 : 0),
        pendingReviewCount: state.summary.pendingReviewCount + (newInv.status === 'FLAGGED' ? 1 : 0),
      };
      return { invoices: updated, summary: newSummary, selectedInvoice: newInv };
    }),

  updateInvoiceStatus: (id, newStatus) =>
    set((state) => {
      const updatedInvoices: Invoice[] = state.invoices.map((inv) => {
        if (inv.id !== id) return inv;
        const newLog: AuditLogEntry = {
          id: `al-user-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          actor: 'Auditor User',
          role: 'Auditor',
          action: `Status change to ${newStatus}`,
          details: `User manually changed invoice status to ${newStatus}`,
          status: 'SUCCESS',
        };
        return {
          ...inv,
          status: newStatus,
          auditLogs: [...inv.auditLogs, newLog],
        };
      });

      const updatedSelected =
        state.selectedInvoice && state.selectedInvoice.id === id
          ? updatedInvoices.find((i) => i.id === id) || null
          : state.selectedInvoice;

      return { invoices: updatedInvoices, selectedInvoice: updatedSelected };
    }),

  selectInvoice: (inv) => set({ selectedInvoice: inv }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setRiskFilter: (filter) => set({ selectedRiskFilter: filter }),
  setStatusFilter: (filter) => set({ selectedStatusFilter: filter }),

  toggleDarkMode: () =>
    set((state) => {
      const nextDark = !state.darkMode;
      if (typeof document !== 'undefined') {
        if (nextDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { darkMode: nextDark };
    }),

  approveInvoice: (id) => get().updateInvoiceStatus(id, 'APPROVED'),
  flagInvoice: (id) => get().updateInvoiceStatus(id, 'FLAGGED'),
  rejectInvoice: (id) => get().updateInvoiceStatus(id, 'REJECTED'),
}));
