#!/usr/bin/env node

/**
 * Auth System Test Script
 * Tests all auth endpoints
 */

const API_URL = 'http://localhost:8000/api/v1';

async function makeRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testHealthCheck() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: Health Check');
  console.log('='.repeat(70));
  
  try {
    const response = await fetch('http://localhost:8000/health');
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      console.log('✅ Health check passed');
      console.log(`   Status: ${data.status}`);
      console.log(`   Service: ${data.service}`);
      return true;
    } else {
      console.log('❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Could not reach server:', error.message);
    return false;
  }
}

async function testSignup() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: Signup Endpoint');
  console.log('='.repeat(70));
  
  const testUser = {
    email: 'testuser@invoiceguard.com',
    password: 'TestPass123!',
    full_name: 'Test User',
    role: 'auditor'
  };
  
  console.log(`\nAttempting signup with:`);
  console.log(`   Email: ${testUser.email}`);
  console.log(`   Role: ${testUser.role}`);
  
  const result = await makeRequest('/auth/signup', 'POST', testUser);
  
  if (result.ok) {
    console.log('✅ Signup successful');
    console.log(`   Message: ${result.data.message}`);
    console.log(`   User ID: ${result.data.user_id}`);
    return true;
  } else {
    console.log('❌ Signup failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.data?.error || result.error || 'Unknown error'}`);
    return false;
  }
}

async function testSetupAdmin() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: Setup Admin Route (if enabled)');
  console.log('='.repeat(70));
  
  const adminUser = {
    email: 'admin@invoiceguard.com',
    password: 'AdminPass123!',
    full_name: 'Test Admin'
  };
  
  console.log(`\nAttempting setup-admin with:`);
  console.log(`   Email: ${adminUser.email}`);
  
  const result = await makeRequest('/auth/setup-admin', 'POST', adminUser);
  
  if (result.ok) {
    console.log('✅ Setup admin successful');
    console.log(`   Message: ${result.data.message}`);
    console.log(`   User ID: ${result.data.user_id}`);
    return true;
  } else if (result.status === 404) {
    console.log('⚠️  Setup admin route not found (disabled as expected)');
    return true;
  } else {
    console.log('❌ Setup admin failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.data?.error || result.error || 'Unknown error'}`);
    return false;
  }
}

async function testAssignRole() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 4: Assign Role Endpoint');
  console.log('='.repeat(70));
  
  const roleAssignment = {
    email: 'testuser@invoiceguard.com',
    role: 'admin'
  };
  
  console.log(`\nAttempting to assign role:`);
  console.log(`   Email: ${roleAssignment.email}`);
  console.log(`   New Role: ${roleAssignment.role}`);
  
  const result = await makeRequest('/auth/assign-role', 'POST', roleAssignment);
  
  if (result.ok) {
    console.log('✅ Assign role successful');
    console.log(`   Message: ${result.data.message}`);
    return true;
  } else {
    console.log('❌ Assign role failed');
    console.log(`   Error: ${result.data?.error || result.error || 'Unknown error'}`);
    return false;
  }
}

async function testGetUserRole() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 5: Get User Role Endpoint');
  console.log('='.repeat(70));
  
  const email = 'testuser@invoiceguard.com';
  
  console.log(`\nGetting role for: ${email}`);
  
  const result = await makeRequest(`/auth/user-role/${email}`, 'GET');
  
  if (result.ok) {
    console.log('✅ Get user role successful');
    console.log(`   Role: ${result.data.role}`);
    console.log(`   Full Name: ${result.data.full_name || 'N/A'}`);
    console.log(`   Department: ${result.data.department || 'N/A'}`);
    return true;
  } else {
    console.log('❌ Get user role failed');
    console.log(`   Error: ${result.data?.error || result.error || 'Unknown error'}`);
    return false;
  }
}

async function testListUsers() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 6: List Users Endpoint');
  console.log('='.repeat(70));
  
  console.log(`\nFetching list of all users...`);
  
  const result = await makeRequest('/auth/users', 'GET');
  
  if (result.ok) {
    console.log('✅ List users successful');
    console.log(`   Total users: ${result.data.data.length}`);
    if (result.data.data.length > 0) {
      console.log(`   Users:`);
      result.data.data.slice(0, 3).forEach((user, i) => {
        console.log(`     ${i + 1}. ${user.email} (${user.role})`);
      });
      if (result.data.data.length > 3) {
        console.log(`     ... and ${result.data.data.length - 3} more`);
      }
    }
    return true;
  } else {
    console.log('❌ List users failed');
    console.log(`   Error: ${result.data?.error || result.error || 'Unknown error'}`);
    return false;
  }
}

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║          INVOICE GUARD - AUTH SYSTEM TEST                         ║');
  console.log('║                                                                   ║');
  console.log('║  Testing:                                                         ║');
  console.log('║  1. Health check                                                  ║');
  console.log('║  2. Signup endpoint                                               ║');
  console.log('║  3. Setup admin route                                             ║');
  console.log('║  4. Assign role endpoint                                          ║');
  console.log('║  5. Get user role endpoint                                        ║');
  console.log('║  6. List users endpoint                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  console.log(`\nBackend API: ${API_URL}`);
  console.log('Checking if server is running...');
  
  // Test 1: Health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Server is not running!');
    console.log('\nStart the server with:');
    console.log('  cd backend && npm start');
    process.exit(1);
  }
  
  // Test 2: Signup
  const signupOk = await testSignup();
  
  // Test 3: Setup admin
  const setupAdminOk = await testSetupAdmin();
  
  // Test 4: Assign role
  const assignRoleOk = await testAssignRole();
  
  // Test 5: Get user role
  const getRoleOk = await testGetUserRole();
  
  // Test 6: List users
  const listUsersOk = await testListUsers();
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  
  const tests = [
    { name: 'Health Check', ok: healthOk },
    { name: 'Signup', ok: signupOk },
    { name: 'Setup Admin', ok: setupAdminOk },
    { name: 'Assign Role', ok: assignRoleOk },
    { name: 'Get User Role', ok: getRoleOk },
    { name: 'List Users', ok: listUsersOk }
  ];
  
  const passed = tests.filter(t => t.ok).length;
  const total = tests.length;
  
  console.log(`\nPassed: ${passed}/${total}`);
  tests.forEach(t => {
    console.log(`  ${t.ok ? '✅' : '❌'} ${t.name}`);
  });
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Auth system is working correctly.');
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) failed. Check errors above.`);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
