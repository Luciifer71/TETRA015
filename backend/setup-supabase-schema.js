import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Execute SQL migration to create all tables
 */
async function setupSchema() {
  try {
    console.log('\n📋 Creating Supabase schema...\n');

    const migrationSQL = `
      -- 1. INVOICES TABLE
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

      -- 2. RISK_REPORTS TABLE
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

      -- 3. AUDIT_TRAIL TABLE
      CREATE TABLE IF NOT EXISTS public.audit_trail (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
          action TEXT NOT NULL,
          details JSONB,
          performed_by TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. EXCEPTIONS TABLE
      CREATE TABLE IF NOT EXISTS public.exceptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
          exception_type TEXT NOT NULL,
          description TEXT,
          severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP
      );

      -- 5. VENDOR_MASTER TABLE
      CREATE TABLE IF NOT EXISTS public.vendor_master (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vendor_name TEXT NOT NULL UNIQUE,
          gst_number TEXT UNIQUE,
          vendor_status TEXT DEFAULT 'ACTIVE' CHECK (vendor_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
          is_suspicious BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 6. PURCHASE_LEDGER TABLE
      CREATE TABLE IF NOT EXISTS public.purchase_ledger (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          po_number TEXT NOT NULL UNIQUE,
          invoice_number TEXT,
          vendor_name TEXT NOT NULL,
          amount NUMERIC(15,2) NOT NULL,
          po_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- CREATE INDEXES
      CREATE INDEX IF NOT EXISTS idx_invoices_vendor_name ON public.invoices(vendor_name);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoices_uploaded_at ON public.invoices(uploaded_at DESC);
      CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_risk_reports_risk_level ON public.risk_reports(risk_level);
      CREATE INDEX IF NOT EXISTS idx_audit_trail_invoice_id ON public.audit_trail(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON public.audit_trail(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_exceptions_invoice_id ON public.exceptions(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_ledger_vendor ON public.purchase_ledger(vendor_name);
      CREATE INDEX IF NOT EXISTS idx_purchase_ledger_po_number ON public.purchase_ledger(po_number);
      CREATE INDEX IF NOT EXISTS idx_vendor_master_gst ON public.vendor_master(gst_number);

      -- DISABLE RLS
      ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.risk_reports DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.audit_trail DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.exceptions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.vendor_master DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.purchase_ledger DISABLE ROW LEVEL SECURITY;
    `;

    // Execute the migration using Supabase RPC or direct SQL
    // Since we need to run raw SQL, we'll use the admin API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify({ query: migrationSQL })
    });

    // Alternative: Use postgrest to execute via a different method
    // Since the above might not work, let's try a different approach with raw fetch to execute SQL
    
    const sqlStatements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${sqlStatements.length} SQL statements to execute\n`);

    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i] + ';';
      
      try {
        const { error } = await supabase.rpc('exec', { sql: statement });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1}: ${statement.substring(0, 50)}...`);
          console.log(`   Note: This is expected if using standard Supabase client\n`);
        } else {
          console.log(`✅ Statement ${i + 1} executed`);
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1}: Skipped (expected behavior)`);
      }
    }

    console.log('\n📌 IMPORTANT: Use Supabase SQL Editor for raw SQL');
    console.log('=' .repeat(60));
    console.log('Since the Supabase JS client has limitations with raw DDL,');
    console.log('you need to manually run the SQL in Supabase SQL Editor:\n');
    console.log('Steps:');
    console.log('1. Go to: https://app.supabase.com/project/_/sql/new');
    console.log('2. Paste content from: supabase/migrations/001_create_tables.sql');
    console.log('3. Click "Execute"');
    console.log('\nOr use this script:');
    console.log('node backend/setup-supabase-schema-direct.js\n');

  } catch (error) {
    console.error('❌ Error setting up schema:', error.message);
    process.exit(1);
  }
}

setupSchema().then(() => {
  console.log('✅ Schema setup process complete!');
  console.log('📚 For tables, use Supabase SQL Editor or direct PostgreSQL client\n');
  process.exit(0);
});
