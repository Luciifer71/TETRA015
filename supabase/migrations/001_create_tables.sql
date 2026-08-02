-- Invoice Audit Platform - Supabase Schema
-- Run this in Supabase SQL Editor
-- Date: August 2, 2026

-- 1. INVOICES TABLE (Main invoice data)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    vendor_name TEXT NOT NULL,
    vendor_gst TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal NUMERIC(15,2),
    tax_amount NUMERIC(15,2),
    total_amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    line_items JSONB,
    extracted_data JSONB,
    confidence_scores JSONB,
    file_path TEXT,
    file_type TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FLAGGED', 'APPROVED', 'REJECTED')),
    ledger_match_id UUID,
    vendor_match_id UUID,
    is_duplicate BOOLEAN DEFAULT FALSE,
    uploaded_by UUID,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. RISK_REPORTS TABLE (Risk scores and analysis)
CREATE TABLE IF NOT EXISTS public.risk_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL UNIQUE REFERENCES public.invoices(id) ON DELETE CASCADE,
    risk_score NUMERIC(5,2),
    risk_level TEXT CHECK (risk_level IN ('MINIMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_factors JSONB,
    recommendations TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. AUDIT_TRAIL TABLE (Activity log)
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    performed_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. EXCEPTIONS TABLE (Validation failures)
CREATE TABLE IF NOT EXISTS public.exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    exception_type TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 5. VENDOR_MASTER TABLE (Approved vendors)
CREATE TABLE IF NOT EXISTS public.vendor_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name TEXT NOT NULL UNIQUE,
    gst_number TEXT UNIQUE,
    vendor_status TEXT DEFAULT 'ACTIVE' CHECK (vendor_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. PURCHASE_LEDGER TABLE (PO records)
CREATE TABLE IF NOT EXISTS public.purchase_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL UNIQUE,
    invoice_number TEXT,
    vendor_name TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    po_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_invoices_vendor_name ON public.invoices(vendor_name);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_uploaded_at ON public.invoices(uploaded_at DESC);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_risk_reports_risk_level ON public.risk_reports(risk_level);
CREATE INDEX idx_audit_trail_invoice_id ON public.audit_trail(invoice_id);
CREATE INDEX idx_audit_trail_created_at ON public.audit_trail(created_at DESC);
CREATE INDEX idx_exceptions_invoice_id ON public.exceptions(invoice_id);
CREATE INDEX idx_purchase_ledger_vendor ON public.purchase_ledger(vendor_name);
CREATE INDEX idx_purchase_ledger_po_number ON public.purchase_ledger(po_number);
CREATE INDEX idx_vendor_master_gst ON public.vendor_master(gst_number);

-- ============================================
-- DISABLE ROW LEVEL SECURITY (RLS OFF)
-- Auth handled at API layer in Node backend
-- ============================================

ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_master DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_ledger DISABLE ROW LEVEL SECURITY;

-- ============================================
-- SETUP COMPLETION
-- ============================================

SELECT 'Schema setup completed successfully!' as status;
