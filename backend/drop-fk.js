#!/usr/bin/env node

/**
 * Drop foreign key constraint to allow setup without auth
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

async function dropFK() {
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

    console.log('📝 Dropping foreign key constraint...');

    // Drop the foreign key constraint
    try {
      await client.query(
        'ALTER TABLE public.users_roles DROP CONSTRAINT users_roles_auth_id_fkey;'
      );
      console.log('  ✓ Foreign key constraint dropped');
    } catch (err) {
      console.log('  ⓘ Constraint may already be dropped:', err.message.split('\n')[0]);
    }

    // Verify constraint is gone
    const result = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users_roles' AND constraint_name = 'users_roles_auth_id_fkey'
    `);

    if (result.rows.length === 0) {
      console.log('\n✅ Foreign key constraint removed successfully!');
      console.log('   You can now create users without valid auth_id');
    } else {
      console.log('❌ Constraint may still exist');
    }

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

dropFK().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
