#!/usr/bin/env node

/**
 * Setup custom auth table for storing credentials
 * Bypasses Supabase Auth limitations
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function setupCustomAuth() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set in .env');
  }

  const pool = new Pool({
    connectionString: databaseUrl
  });

  try {
    console.log('🔐 Setting up custom auth table...');
    const client = await pool.connect();

    // Create auth_credentials table
    console.log('\n📝 Step 1: Creating auth_credentials table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.auth_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✓ Table created');

    // Create index on email
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_credentials_email ON public.auth_credentials(email);
    `);
    console.log('   ✓ Index created');

    // Insert admin credentials
    console.log('\n📝 Step 2: Inserting admin credentials...');
    const passwordHash = hashPassword('admin123');
    
    const result = await client.query(
      `INSERT INTO public.auth_credentials (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = $2,
         updated_at = CURRENT_TIMESTAMP
       RETURNING email`,
      ['admin@invoiceguard.io', passwordHash]
    );

    console.log(`   ✓ Admin credentials stored`);
    console.log(`   ✓ Email: ${result.rows[0].email}`);
    console.log(`   ✓ Password: admin123 (hashed)`);

    // Verify admin user exists in users_roles
    console.log('\n📝 Step 3: Verifying admin user in users_roles...');
    const userCheck = await client.query(
      `SELECT email, role FROM public.users_roles WHERE email = $1`,
      ['admin@invoiceguard.io']
    );

    if (userCheck.rowCount === 0) {
      console.log('   ⚠️  Admin user not in users_roles, creating...');
      await client.query(
        `INSERT INTO public.users_roles (auth_id, email, role, full_name, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET role = $3`,
        [
          '00000000-0000-0000-0000-000000000000',
          'admin@invoiceguard.io',
          'admin',
          'System Administrator',
          true
        ]
      );
      console.log('   ✓ Admin user created in users_roles');
    } else {
      console.log(`   ✓ Admin user exists with role: ${userCheck.rows[0].role}`);
    }

    console.log('\n✅ Custom auth setup complete!');
    console.log('\n📌 Login with:');
    console.log('   Email: admin@invoiceguard.io');
    console.log('   Password: admin123');
    console.log('   Endpoint: POST /api/v1/auth/login');

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupCustomAuth().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
