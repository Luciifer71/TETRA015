#!/usr/bin/env node

/**
 * Database Setup Script
 * Initializes the users_roles table and auth functions
 * This runs using the DATABASE_URL (direct PostgreSQL connection)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

async function setupDatabase() {
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

    console.log('📝 Running database setup...');

    // Create users_roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'auditor', 'user')),
          full_name TEXT,
          department TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('  ✓ Created users_roles table');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_roles_email ON public.users_roles(email);
    `);
    console.log('  ✓ Created email index');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_roles_auth_id ON public.users_roles(auth_id);
    `);
    console.log('  ✓ Created auth_id index');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_roles_role ON public.users_roles(role);
    `);
    console.log('  ✓ Created role index');

    // Create helper functions
    await client.query(`
      CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
      RETURNS TEXT AS $$
      DECLARE
        user_role TEXT;
      BEGIN
        SELECT role INTO user_role FROM public.users_roles WHERE email = $1;
        RETURN COALESCE(user_role, 'user');
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);
    console.log('  ✓ Created get_user_role function');

    await client.query(`
      CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN (SELECT role FROM public.users_roles WHERE email = $1) = 'admin';
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);
    console.log('  ✓ Created is_admin function');

    await client.query(`
      CREATE OR REPLACE FUNCTION is_auditor_or_admin(user_email TEXT)
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN (SELECT role FROM public.users_roles WHERE email = $1) IN ('admin', 'auditor');
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);
    console.log('  ✓ Created is_auditor_or_admin function');

    // Verify the table was created
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users_roles'
      );
    `);

    if (result.rows[0].exists) {
      console.log('\n✅ Database setup completed successfully!');
      console.log('\n📊 Table created:');
      console.log('   - public.users_roles');
      console.log('\n🔧 Helper functions created:');
      console.log('   - get_user_role()');
      console.log('   - is_admin()');
      console.log('   - is_auditor_or_admin()');
      console.log('\n📈 Indexes created:');
      console.log('   - idx_users_roles_email');
      console.log('   - idx_users_roles_auth_id');
      console.log('   - idx_users_roles_role');
    } else {
      console.log('❌ Table creation failed');
      process.exit(1);
    }

    client.release();
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Could not connect to database.');
      console.error('   Check DATABASE_URL in .env');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
