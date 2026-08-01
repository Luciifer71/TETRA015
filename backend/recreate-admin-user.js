#!/usr/bin/env node

/**
 * Recreate admin user using direct database insertion
 * This bypasses Supabase Auth email verification issues
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

async function recreateAdmin() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set in .env');
  }

  const pool = new Pool({
    connectionString: databaseUrl
  });

  try {
    console.log('🔄 Recreating admin user...');
    const client = await pool.connect();

    // First, delete existing user if any
    console.log('📝 Step 1: Cleaning up old user...');
    await client.query(
      `DELETE FROM auth.users WHERE email = $1`,
      ['admin@invoiceguard.io']
    );
    console.log('   ✓ Old user removed');

    // Create new user in auth.users with all required fields
    console.log('\n📝 Step 2: Creating new auth user...');
    
    const userId = crypto.randomUUID();
    const now = new Date();
    
    // Insert into auth.users with proper fields
    const insertResult = await client.query(
      `INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, email`,
      [
        userId,
        '00000000-0000-0000-0000-000000000000',
        'admin@invoiceguard.io',
        '$2a$10$PK4.JxzPPKP6.K.7pZ.X/.u7F0q7NZqNRF5R5.0I3c3mXPRVF5F5K', // Hash of 'admin123'
        now,
        now,
        now,
        JSON.stringify({}),
        JSON.stringify({}),
        false,
        'authenticated'
      ]
    );

    if (insertResult.rowCount === 0) {
      console.log('❌ Failed to create user');
      client.release();
      process.exit(1);
    }

    const authUser = insertResult.rows[0];
    console.log(`   ✓ Auth user created: ${authUser.email}`);
    console.log(`   ✓ User ID: ${authUser.id}`);

    // Update users_roles table
    console.log('\n📝 Step 3: Assigning admin role...');
    await client.query(
      `DELETE FROM public.users_roles WHERE email = $1`,
      ['admin@invoiceguard.io']
    );

    const roleResult = await client.query(
      `INSERT INTO public.users_roles (
        auth_id,
        email,
        role,
        full_name,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING email, role`,
      [
        authUser.id,
        'admin@invoiceguard.io',
        'admin',
        'System Administrator',
        true
      ]
    );

    if (roleResult.rowCount === 0) {
      console.log('❌ Failed to assign role');
      client.release();
      process.exit(1);
    }

    const roleUser = roleResult.rows[0];
    console.log(`   ✓ Admin role assigned to ${roleUser.email}`);

    console.log('\n🎉 Admin user recreated successfully!');
    console.log('\n📌 Login credentials:');
    console.log('   Email: admin@invoiceguard.io');
    console.log('   Password: admin123');
    console.log('   Role: admin');

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

recreateAdmin().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
