#!/usr/bin/env node

/**
 * Setup Admin User with Authentication
 * Creates admin@invoiceguard.io with password admin123
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdmin() {
  try {
    console.log('🔐 Setting up admin user...');
    console.log('   Email: admin@invoiceguard.io');
    console.log('   Password: admin123');
    console.log('   Role: admin\n');

    // Step 1: Create user in Supabase Auth
    console.log('📝 Step 1: Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@invoiceguard.io',
      password: 'admin123'
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      
      // If user already exists, that's ok - we can still update the role
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  User already exists, updating role...');
        
        // Get the user ID by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const user = users.find(u => u.email === 'admin@invoiceguard.io');
        if (!user) {
          console.error('❌ Could not find user to update');
          process.exit(1);
        }

        // Update role in database
        const { error: upsertError } = await supabase
          .from('users_roles')
          .upsert({
            auth_id: user.id,
            email: 'admin@invoiceguard.io',
            role: 'admin',
            full_name: 'System Administrator',
            is_active: true
          }, { onConflict: 'email' });

        if (upsertError) throw upsertError;

        console.log('✅ Admin role updated successfully');
        console.log('\n🎉 Admin user setup complete!');
        return;
      } else {
        throw authError;
      }
    }

    console.log('✅ Auth user created');
    console.log(`   User ID: ${authData.user.id}`);

    // Step 2: Create role in database
    console.log('\n📝 Step 2: Assigning admin role...');
    const { data: roleData, error: roleError } = await supabase
      .from('users_roles')
      .upsert({
        auth_id: authData.user.id,
        email: 'admin@invoiceguard.io',
        role: 'admin',
        full_name: 'System Administrator',
        is_active: true
      }, { onConflict: 'email' });

    if (roleError) throw roleError;

    console.log('✅ Admin role assigned');

    // Step 3: Verify
    console.log('\n📝 Step 3: Verifying setup...');
    const { data: verify, error: verifyError } = await supabase
      .from('users_roles')
      .select('*')
      .eq('email', 'admin@invoiceguard.io')
      .single();

    if (verifyError) throw verifyError;

    console.log('✅ Verification successful');
    console.log(`   Email: ${verify.email}`);
    console.log(`   Role: ${verify.role}`);
    console.log(`   Full Name: ${verify.full_name}`);
    console.log(`   Active: ${verify.is_active}`);

    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📌 Login credentials:');
    console.log('   Email: admin@invoiceguard.io');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('\n   Can access: Dashboard, Invoices, Settings, Audit Trail, Upload');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupAdmin();
