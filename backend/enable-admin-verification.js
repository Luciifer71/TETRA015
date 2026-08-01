#!/usr/bin/env node

/**
 * Enable admin user for immediate login without email verification
 * This marks the user's email as confirmed so they can log in
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

async function enableAdmin() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set in .env');
  }

  const pool = new Pool({
    connectionString: databaseUrl
  });

  try {
    console.log('🔓 Enabling admin user for immediate login...');
    const client = await pool.connect();

    // Mark email as confirmed in Supabase auth.users
    const result = await client.query(
      `UPDATE auth.users 
       SET email_confirmed_at = NOW(),
           confirmed_at = NOW()
       WHERE email = $1
       RETURNING id, email, email_confirmed_at`,
      ['admin@invoiceguard.io']
    );

    if (result.rowCount === 0) {
      console.log('❌ User not found');
      client.release();
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✅ Admin user enabled for login');
    console.log(`   Email: ${user.email}`);
    console.log(`   Confirmed at: ${user.email_confirmed_at}`);
    console.log(`   User ID: ${user.id}`);

    console.log('\n✅ Admin can now login immediately');
    console.log('\n📌 Login credentials:');
    console.log('   Email: admin@invoiceguard.io');
    console.log('   Password: admin123');

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

enableAdmin().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
