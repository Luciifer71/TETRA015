#!/usr/bin/env node

/**
 * Relax auth_id constraint to allow admin setup during Supabase email rate limit
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

async function relaxConstraint() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set in .env');
  }

  const pool = new Pool({
    connectionString: databaseUrl
  });

  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();

    console.log('📝 Relaxing auth_id constraint...');

    // Make auth_id nullable
    await client.query(
      'ALTER TABLE public.users_roles ALTER COLUMN auth_id DROP NOT NULL;'
    );

    console.log('  ✓ auth_id is now nullable');

    // Verify
    const result = await client.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users_roles' AND column_name = 'auth_id'
    `);

    if (result.rows[0]?.is_nullable === 'YES') {
      console.log('\n✅ Constraint relaxed successfully!');
      console.log('   You can now create users without auth_id');
    } else {
      console.log('❌ Constraint relaxation may have failed');
      process.exit(1);
    }

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

relaxConstraint().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
