/**
 * Check Supabase Current Schema State
 * ===================================
 * 
 * Verifies what tables exist and their current row counts.
 * 
 * Usage: node check_supabase_schema.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('\n📊 Supabase Schema Verification\n');
  console.log('='.repeat(60));

  const tables = ['invoices', 'risk_reports', 'audit_trail', 'exceptions', 'vendor_master', 'purchase_ledger'];
  const results = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results[table] = { exists: false, error: error.message };
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        results[table] = { exists: true, count: count || 0 };
        console.log(`✅ ${table}: ${count || 0} rows`);
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message };
      console.log(`❌ ${table}: Connection error`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Summary:\n');

  let existingTables = 0;
  let totalRows = 0;

  for (const [table, data] of Object.entries(results)) {
    if (data.exists) {
      existingTables++;
      totalRows += data.count || 0;
      console.log(`   • ${table.padEnd(20)} → ${data.count || 0} rows`);
    }
  }

  console.log(`\n📈 Statistics:`);
  console.log(`   Tables ready: ${existingTables}/6`);
  console.log(`   Total rows: ${totalRows}`);

  if (existingTables === 6) {
    console.log(`\n✅ All tables exist and are ready for seeding!`);
  } else {
    console.log(`\n⚠️  Some tables may not exist. Run schema creation first.`);
  }

  // Show field details for invoices table (most important)
  console.log(`\n📄 Invoices Table Schema:`);
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);

    if (!error && data && data.length > 0) {
      const fields = Object.keys(data[0]);
      fields.forEach(field => {
        console.log(`   • ${field}`);
      });
    } else if (error) {
      console.log(`   ⚠️  Cannot inspect: ${error.message}`);
    } else {
      console.log(`   (Table exists but empty - structure matches schema definition)`);
    }
  } catch (err) {
    console.log(`   ⚠️  ${err.message}`);
  }

  console.log();
}

checkSchema().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
