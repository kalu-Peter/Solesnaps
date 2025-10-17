#!/usr/bin/env node

/**
 * Test Authentication Script
 * Tests login functionality with created users
 */

require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

const TEST_USERS = [
  {
    email: 'admin@solesnaps.com',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    email: 'customer@solesnaps.com',
    password: 'Customer123!',
    role: 'customer'
  }
];

async function testLogin(credentials) {
  try {
    console.log(`\n🔐 Testing login: ${credentials.email}`);
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Login successful!`);
      console.log(`📧 Email: ${result.user?.email || 'N/A'}`);
      console.log(`👤 Role: ${result.user?.role || 'N/A'}`);
      console.log(`🆔 User ID: ${result.user?.id || 'N/A'}`);
      console.log(`🔑 Token received: ${result.tokens?.access_token ? 'Yes' : 'No'}`);
      
      return {
        success: true,
        user: result.user,
        token: result.tokens?.access_token
      };
    } else {
      console.log(`❌ Login failed: ${result.message || 'Unknown error'}`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`🔍 Details:`, result);
      
      return {
        success: false,
        error: result.message || 'Login failed'
      };
    }
    
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testProfile(token) {
  try {
    console.log(`\n👤 Testing profile access...`);
    
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Profile access successful!`);
      console.log(`📧 Email: ${result.email || 'N/A'}`);
      console.log(`👤 Name: ${result.first_name} ${result.last_name}`);
      console.log(`📱 Phone: ${result.phone || 'N/A'}`);
      console.log(`🆔 Profile ID: ${result.id || 'N/A'}`);
      
      return { success: true, profile: result };
    } else {
      console.log(`❌ Profile access failed: ${result.message || 'Unknown error'}`);
      return { success: false, error: result.message };
    }
    
  } catch (error) {
    console.log(`❌ Profile error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAuthentication() {
  console.log('🧪 Testing Supabase Authentication');
  console.log('===================================');
  
  // Check if server is running
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    console.log(`✅ Server is accessible at ${API_BASE}`);
  } catch (error) {
    console.log(`❌ Server not accessible: ${error.message}`);
    console.log(`⚠️ Make sure server is running: cd server && node src/server.js`);
    return;
  }
  
  const results = [];
  
  // Test each user
  for (const credentials of TEST_USERS) {
    const loginResult = await testLogin(credentials);
    
    if (loginResult.success && loginResult.token) {
      // Test profile access
      const profileResult = await testProfile(loginResult.token);
      results.push({
        ...credentials,
        login: loginResult,
        profile: profileResult
      });
    } else {
      results.push({
        ...credentials,
        login: loginResult,
        profile: { success: false, error: 'No token to test profile' }
      });
    }
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Authentication Test Summary');
  console.log('==============================');
  
  const successful = results.filter(r => r.login.success && r.profile.success);
  const failed = results.filter(r => !r.login.success || !r.profile.success);
  
  console.log(`✅ Successful logins: ${successful.length}/${results.length}`);
  console.log(`❌ Failed logins: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Working Accounts:');
    successful.forEach(user => {
      console.log(`  📧 ${user.email} (${user.role}) - Full access`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️ Failed Accounts:');
    failed.forEach(user => {
      const issue = !user.login.success ? 'Login failed' : 'Profile access failed';
      console.log(`  📧 ${user.email}: ${issue}`);
    });
  }
  
  console.log('\n🎯 Results:');
  console.log('===========');
  if (successful.length === results.length) {
    console.log('🎉 ALL TESTS PASSED! Authentication is working perfectly.');
    console.log('✅ Supabase integration is fully functional.');
    console.log('✅ User creation and authentication working.');
    console.log('✅ Profile access working.');
  } else {
    console.log('⚠️ Some tests failed. Check the details above.');
  }
}

// Handle script execution
if (require.main === module) {
  testAuthentication()
    .then(() => {
      console.log('\n✅ Authentication test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Authentication test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testAuthentication };