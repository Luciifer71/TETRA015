-- Phase 4: Real Invoice Data Seeding
-- ===================================
-- Run this in Supabase SQL Editor to seed 10 test invoices
-- Date: August 2, 2026

-- 1. INSERT INVOICES
INSERT INTO public.invoices (
  invoice_number, vendor_name, vendor_gst, invoice_date, due_date,
  subtotal, tax_amount, total_amount, currency, status, uploaded_at, processed_at
) VALUES
  ('952384', 'Polychemtex Inc.', 'GB999999973', '2026-06-14', '2026-07-14', 1072.83, 214.57, 1287.40, 'GBP', 'PROCESSED', NOW(), NOW()),
  ('106017', 'Contoso Asia', 'CN213444466', '2026-06-14', '2026-07-14', 481059.99, 96212.00, 577271.99, 'CNY', 'PROCESSED', NOW(), NOW()),
  ('717256', 'Profile Construction', NULL, '2026-06-14', '2026-07-14', 3299.90, 659.98, 4459.88, 'USD', 'PROCESSED', NOW(), NOW()),
  ('121159', 'Anconia Corp', 'GB339072747', '2026-06-14', '2026-07-14', 1046.16, 209.23, 1255.39, 'GBP', 'PROCESSED', NOW(), NOW()),
  ('38947', 'Cloud VPS', 'EU123456789', '2026-06-14', '2026-07-14', 42.35, 8.47, 50.82, 'USD', 'PROCESSED', NOW(), NOW()),
  ('952385', 'Polychemtex Inc.', 'GB999999973', '2026-06-24', '2026-07-24', 1102.82, 220.56, 1323.38, 'GBP', 'PROCESSED', NOW(), NOW()),
  ('106018', 'Contoso Asia', 'CN213444466', '2026-06-24', '2026-07-24', 482499.75, 96499.95, 578999.70, 'CNY', 'PROCESSED', NOW(), NOW()),
  ('121160', 'Anconia Corp', 'GB339072747', '2026-06-24', '2026-07-24', 1106.06, 221.21, 1327.27, 'GBP', 'PROCESSED', NOW(), NOW()),
  ('38948', 'Cloud VPS', 'EU123456789', '2026-06-24', '2026-07-24', 42.35, 8.47, 50.82, 'USD', 'PROCESSED', NOW(), NOW()),
  ('717257', 'Profile Construction', NULL, '2026-06-24', '2026-07-24', 3449.85, 689.97, 4639.82, 'USD', 'PROCESSED', NOW(), NOW());

-- 2. INSERT RISK REPORTS (for each invoice)
INSERT INTO public.risk_reports (
  invoice_id, risk_score, risk_level, risk_factors, recommendations
)
SELECT 
  id,
  CASE 
    WHEN total_amount > 500000 THEN 55
    WHEN total_amount > 100000 THEN 40
    WHEN currency = 'CNY' THEN 35
    WHEN currency = 'GBP' THEN 30
    ELSE 25
  END as risk_score,
  CASE 
    WHEN total_amount > 500000 THEN 'MEDIUM'
    WHEN total_amount > 100000 THEN 'LOW'
    WHEN currency = 'CNY' THEN 'MEDIUM'
    WHEN currency = 'GBP' THEN 'LOW'
    ELSE 'MINIMAL'
  END as risk_level,
  CASE 
    WHEN total_amount > 500000 THEN '["High amount transaction", "Foreign currency"]'::jsonb
    WHEN total_amount > 100000 THEN '["Medium-high amount"]'::jsonb
    WHEN currency = 'CNY' THEN '["Foreign currency (CNY)"]'::jsonb
    WHEN currency = 'GBP' THEN '["International currency (GBP)"]'::jsonb
    ELSE '["Standard invoice pattern"]'::jsonb
  END as risk_factors,
  ARRAY['Cross-reference vendor database', 'Verify currency conversion', 'Check payment terms'] as recommendations
FROM public.invoices
WHERE invoice_number IN ('952384', '106017', '717256', '121159', '38947', '952385', '106018', '121160', '38948', '717257');

-- 3. INSERT AUDIT TRAIL (one entry per invoice)
INSERT INTO public.audit_trail (
  invoice_id, action, details, performed_by
)
SELECT 
  id,
  'INVOICE_CREATED',
  jsonb_build_object('source', 'Phase 4 SQL seeding', 'timestamp', NOW()::text),
  'system@invoiceguard.ai'
FROM public.invoices
WHERE invoice_number IN ('952384', '106017', '717256', '121159', '38947', '952385', '106018', '121160', '38948', '717257');

-- 4. VERIFICATION QUERIES
SELECT '=== SEEDING VERIFICATION ===' as status;

SELECT 
  'Invoices' as table_name,
  COUNT(*) as record_count,
  SUM(total_amount)::numeric as total_amount,
  STRING_AGG(DISTINCT currency, ', ') as currencies
FROM public.invoices
WHERE invoice_number IN ('952384', '106017', '717256', '121159', '38947', '952385', '106018', '121160', '38948', '717257');

SELECT 
  'Risk Reports' as table_name,
  COUNT(*) as record_count,
  STRING_AGG(DISTINCT risk_level, ', ' ORDER BY risk_level) as risk_levels
FROM public.risk_reports
WHERE invoice_id IN (
  SELECT id FROM public.invoices
  WHERE invoice_number IN ('952384', '106017', '717256', '121159', '38947', '952385', '106018', '121160', '38948', '717257')
);

SELECT 
  'Audit Trail' as table_name,
  COUNT(*) as record_count
FROM public.audit_trail
WHERE invoice_id IN (
  SELECT id FROM public.invoices
  WHERE invoice_number IN ('952384', '106017', '717256', '121159', '38947', '952385', '106018', '121160', '38948', '717257')
);

SELECT '✅ Phase 4 Seeding Complete!' as status;
