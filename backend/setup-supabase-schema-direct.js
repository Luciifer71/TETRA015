import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;

dotenv.config({ path: '.env' });

// Parse Supabase connection string
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL must be set in .env');
  console.error('   Expected format: postgresql://user:password@host:port/database');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase PostgreSQL...\n');

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

/**
 * Create all tables and indexes
 */
async function setupSchema() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL\n');

    const sqlStatements = [
      // 1. INVOICES TABLE
      `CREATE TABLE IF NOT EXISTS public.invoices (
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
      )`,

      // 2. RISK_REPORTS TABLE
      `CREATE TABLE IF NOT EXISTS public.risk_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoice_id UUID NOT NULL UNIQUE REFERENCES public.invoices(id) ON DELETE CASCADE,
          risk_score NUMERIC(5,2),
          risk_level TEXT CHECK (risk_level IN ('MINIMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
          risk_factors JSONB,
          recommendations TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 3. AUDIT_TRAIL TABLE
      `CREATE TABLE IF NOT EXISTS public.audit_trail (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
          action TEXT NOT NULL,
          details JSONB,
          performed_by TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 4. EXCEPTIONS TABLE
      `CREATE TABLE IF NOT EXISTS public.exceptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
          exception_type TEXT NOT NULL,
          description TEXT,
          severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP
      )`,

      // 5. VENDOR_MASTER TABLE
      `CREATE TABLE IF NOT EXISTS public.vendor_master (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vendor_name TEXT NOT NULL UNIQUE,
          gst_number TEXT UNIQUE,
          vendor_status TEXT DEFAULT 'ACTIVE' CHECK (vendor_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
          is_suspicious BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 6. PURCHASE_LEDGER TABLE
      `CREATE TABLE IF NOT EXISTS public.purchase_ledger (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          po_number TEXT NOT NULL UNIQUE,
          invoice_number TEXT,
          vendor_name TEXT NOT NULL,
          amount NUMERIC(15,2) NOT NULL,
          po_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // INDEXES
      `CREATE INDEX IF NOT EXISTS idx_invoices_vendor_name ON public.invoices(vendor_name)`,
      `CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status)`,
      `CREATE INDEX IF NOT EXISTS idx_invoices_uploaded_at ON public.invoices(uploaded_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number)`,
      `CREATE INDEX IF NOT EXISTS idx_risk_reports_risk_level ON public.risk_reports(risk_level)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_trail_invoice_id ON public.audit_trail(invoice_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_trail_id ON public.audit_trail(id)`,
      `CREATE INDEX IF NOT EXISTS idx_exceptions_invoice_id ON public.exceptions(invoice_id)`,
      `CREATE INDEX IF NOT EXISTS idx_purchase_ledger_vendor ON public.purchase_ledger(vendor_name)`,
      `CREATE INDEX IF NOT EXISTS idx_purchase_ledger_po_number ON public.purchase_ledger(po_number)`,
      `CREATE INDEX IF NOT EXISTS idx_vendor_master_gst ON public.vendor_master(gst_number)`,

      // DISABLE RLS
      `ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY`,
      `ALTER TABLE public.risk_reports DISABLE ROW LEVEL SECURITY`,
      `ALTER TABLE public.audit_trail DISABLE ROW LEVEL SECURITY`,
      `ALTER TABLE public.exceptions DISABLE ROW LEVEL SECURITY`,
      `ALTER TABLE public.vendor_master DISABLE ROW LEVEL SECURITY`,
      `ALTER TABLE public.purchase_ledger DISABLE ROW LEVEL SECURITY`
    ];

    console.log(`📝 Executing ${sqlStatements.length} SQL statements...\n`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      const shortStr = statement.substring(0, 60) + (statement.length > 60 ? '...' : '');

      try {
        await client.query(statement);
        console.log(`✅ ${i + 1}. ${shortStr}`);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  ${i + 1}. ${shortStr} (already exists)`);
          skipCount++;
        } else {
          console.error(`❌ ${i + 1}. ${shortStr}`);
          console.error(`   Error: ${error.message}\n`);
        }
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SUMMARY`);
    console.log(`${'='.repeat(70)}`);
    console.log(`✅ Created/Updated: ${successCount}`);
    console.log(`⏭️  Already exists:  ${skipCount}`);
    console.log(`📈 Total:           ${sqlStatements.length}`);

    // Verify tables were created
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 VERIFYING TABLES`);
    console.log(`${'='.repeat(70)}\n`);

    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('invoices', 'risk_reports', 'audit_trail', 'exceptions', 'vendor_master', 'purchase_ledger')
      ORDER BY table_name
    `;

    const result = await client.query(tableQuery);
    const tables = result.rows.map(row => row.table_name);

    if (tables.length === 6) {
      console.log('✅ All 6 tables created successfully!\n');
      tables.forEach((table, idx) => {
        console.log(`   ${idx + 1}. ${table}`);
      });
    } else {
      console.log(`⚠️  Only ${tables.length} out of 6 tables found:`);
      tables.forEach((table, idx) => {
        console.log(`   ${idx + 1}. ${table}`);
      });
    }

    // Show index count
    console.log(`\n${'='.repeat(70)}`);
    const indexQuery = `
      SELECT COUNT(*) as index_count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('invoices', 'risk_reports', 'audit_trail', 'exceptions', 'vendor_master', 'purchase_ledger')
    `;

    const indexResult = await client.query(indexQuery);
    const indexCount = indexResult.rows[0].index_count;
    console.log(`📑 INDEXES: ${indexCount} indexes created\n`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Schema setup complete!\n');
  }
}

// Run setup
setupSchema()
  .then(() => {
    console.log('🎉 Supabase schema is ready to use!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
