#!/usr/bin/env node

/**
 * Direct Admin Setup
 * Creates admin user and sets up Supabase tables if needed
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://lujjfxzmswxiihksssyc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JWmkaGZKby7OaMwk-M-jTw_-58ttYDz';

const ADMIN_EMAIL = 'admin@invoiceguard.com';
const ADMIN_PASSWORD = 'SecureAdminPass123!';
const ADMIN_NAME = 'System Administrator';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createAdminUser() {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 1: Creating Admin User in Supabase Auth');
  console.log('='.repeat(70));
  
  try {
    console.log(`\nEmail: ${ADMIN_EMAIL}`);
    console.log(`Name: ${ADMIN_NAME}`);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists');
        return { exists: true };
      }
      throw authError;
    }
    
    console.log('✅ Admin user created in Supabase Auth');
    console.log(`   User ID: ${authData.user.id}`);
    
    return { 
      success: true, 
      userId: authData.user.id,
      email: authData.user.email 
    };
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    return { error: error.message };
  }
}

async function assignAdminRole(userId, email) {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 2: Assigning Admin Role');
  console.log('='.repeat(70));
  
  try {
    console.log(`\nAssigning admin role to: ${email}`);
    
    const { data, error } = await supabase
      .from('users_roles')
      .insert({
        auth_id: userId,
        email: email,
        role: 'admin',
        full_name: ADMIN_NAME,
        is_active: true
      })
      .select();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  Table does not exist yet');
        console.log('   This is expected - SQL setup needs to be run in Supabase');
        return { tableNotFound: true };
      }
      throw error;
    }
    
    console.log('✅ Admin role assigned');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error assigning role:', error.message);
    return { error: error.message };
  }
}

async function saveCredentials(userId, email) {
  console.log('\n' + '='.repeat(70));
  console.log('STEP 3: Saving Credentials');
  console.log('='.repeat(70));
  
  try {
    const credsFile = join(__dirname, '.admin-credentials');
    
    const credentials = {
      userId,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      createdAt: new Date().toISOString(),
      note: 'KEEP THIS FILE SECURE - Store in secure location and delete original'
    };
    
    fs.writeFileSync(credsFile, JSON.stringify(credentials, null, 2), 'utf8');
    
    console.log(`\n✅ Credentials saved to .admin-credentials`);
    console.log('   ⚠️  This file contains sensitive information');
    console.log('   Move it to a secure location and delete from repo');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving credentials:', error.message);
    return { error: error.message };
  }
}

async function displaySummary(result) {
  console.log('\n' + '='.repeat(70));
  console.log('SETUP SUMMARY');
  console.log('='.repeat(70));
  
  if (result.error) {
    console.log('\n❌ Setup Failed');
    console.log(`   Error: ${result.error}`);
    return false;
  }
  
  if (result.tableNotFound) {
    console.log('\n⚠️  PENDING: SQL Setup Required in Supabase');
    console.log('\nTo complete setup:');
    console.log('1. Go to: https://app.supabase.com');
    console.log('2. Select project: lujjfxzmswxiihksssyc');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste contents of: supabase/run_setup.sql');
    console.log('5. Click Run');
    console.log('6. Run this script again');
    return false;
  }
  
  console.log('\n✅ Admin Setup Complete!');
  console.log(`\nAdmin Account:`);
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   User ID: ${result.userId}`);
  
  console.log(`\nNext Steps:`);
  console.log(`1. Set ENABLE_SETUP_ADMIN=false in backend/.env`);
  console.log(`2. Restart backend: cd backend && npm start`);
  console.log(`3. Start frontend: cd frontend && npm run dev`);
  console.log(`4. Visit http://localhost:3000/login`);
  console.log(`5. Login with admin credentials`);
  
  return true;
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║          INVOICE GUARD - ADMIN SETUP (DIRECT)                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  // Create admin user
  const createResult = await createAdminUser();
  
  if (createResult.error) {
    await displaySummary(createResult);
    process.exit(1);
  }
  
  // If user already exists, try to get existing user
  let userId = createResult.userId || createResult.existingUserId;
  
  // Assign role (may fail if table doesn't exist)
  const roleResult = await assignAdminRole(userId, ADMIN_EMAIL);
  
  if (roleResult.tableNotFound) {
    // Save credentials anyway for later
    await saveCredentials(userId, ADMIN_EMAIL);
    await displaySummary(roleResult);
    process.exit(0);
  }
  
  if (roleResult.error) {
    await displaySummary(roleResult);
    process.exit(1);
  }
  
  // Save credentials
  await saveCredentials(userId, ADMIN_EMAIL);
  
  // Success
  const success = await displaySummary({
    success: true,
    userId,
    email: ADMIN_EMAIL
  });
  
  if (success) {
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
