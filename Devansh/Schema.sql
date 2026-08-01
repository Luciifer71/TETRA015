-- Enable UUID extension (Supabase default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- PROFILES TABLE (Links to Supabase Auth)
-- ================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'ANALYST' CHECK (role IN ('ADMIN', 'AUDITOR', 'ANALYST', 'VIEWER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatic Profile Creation Trigger when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'ANALYST')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- INVOICES TABLE
-- ================================================
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    vendor_gst TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal NUMERIC(15,2) NOT NULL,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    line_items JSONB,
    extracted_data JSONB,
    confidence_scores JSONB,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FLAGGED', 'APPROVED', 'REJECTED')),
    ledger_match_id UUID,
    vendor_match_id UUID,
    is_duplicate BOOLEAN DEFAULT FALSE,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- PURCHASE LEDGER TABLE
-- ================================================
CREATE TABLE public.purchase_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL UNIQUE,
    invoice_number TEXT,
    vendor_name TEXT NOT NULL,
    vendor_gst TEXT,
    po_date DATE NOT NULL,
    expected_amount NUMERIC(15,2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'MATCHED', 'CLOSED', 'CANCELLED')),
    matched_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key back to invoices table
ALTER TABLE public.invoices 
  ADD CONSTRAINT fk_ledger FOREIGN KEY (ledger_match_id) REFERENCES public.purchase_ledger(id) ON DELETE SET NULL;

-- ================================================
-- VENDOR MASTER TABLE
-- ================================================
CREATE TABLE public.vendor_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name TEXT NOT NULL,
    vendor_code TEXT UNIQUE,
    gst_number TEXT UNIQUE,
    pan_number TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED')),
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_notes TEXT,
    total_transactions INTEGER DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoices 
  ADD CONSTRAINT fk_vendor FOREIGN KEY (vendor_match_id) REFERENCES public.vendor_master(id) ON DELETE SET NULL;

-- ================================================
-- EXCEPTIONS TABLE
-- ================================================
CREATE TABLE public.exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    exception_type TEXT NOT NULL,
    exception_category TEXT NOT NULL CHECK (exception_category IN ('VALIDATION', 'MATCHING', 'COMPLIANCE', 'DUPLICATE')),
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    field_name TEXT,
    expected_value TEXT,
    actual_value TEXT,
    auto_detected BOOLEAN DEFAULT TRUE,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- RISK REPORTS TABLE
-- ================================================
CREATE TABLE public.risk_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL UNIQUE REFERENCES public.invoices(id) ON DELETE CASCADE,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_factors JSONB NOT NULL,
    rule_results JSONB,
    confidence_score NUMERIC(5,2),
    explanation TEXT,
    recommendations TEXT,
    duplicate_of UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    similarity_score NUMERIC(5,2),
    requires_review BOOLEAN DEFAULT FALSE,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- AUDIT TRAIL TABLE
-- ================================================
CREATE TABLE public.audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    action_category TEXT NOT NULL CHECK (action_category IN ('SYSTEM', 'USER', 'AI', 'BATCH')),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT,
    details TEXT,
    metadata JSONB,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ================================================
-- UPLOADS TABLE
-- ================================================
CREATE TABLE public.uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL UNIQUE,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    file_extension TEXT NOT NULL,
    upload_status TEXT DEFAULT 'PENDING' CHECK (upload_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    processing_time_ms INTEGER,
    error_message TEXT,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users access to system tables
CREATE POLICY "Authenticated users can view invoices" ON public.invoices 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert invoices" ON public.invoices 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoices" ON public.invoices 
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can access reports" ON public.risk_reports 
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access vendor master" ON public.vendor_master 
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access exceptions" ON public.exceptions 
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access audit trail" ON public.audit_trail 
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can access uploads" ON public.uploads 
  FOR ALL TO authenticated USING (true);