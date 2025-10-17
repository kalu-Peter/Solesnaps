#!/usr/bin/env node

/**
 * Fix User Profiles Script
 * Creates profiles in custom users table for existing Supabase Auth users
 */

const { supabaseAdmin } = require('../src/config/supabase');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Expected user data
const EXPECTED_USERS = [
  {
    email: 'admin@solesnaps.com',
    password: 'Admin123!',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1234567890'
  },
  {
    email: 'customer@solesnaps.com', 
    password: 'Customer123!',
    role: 'customer',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1987654321'
  },
  {
    email: 'test@solesnaps.com',
    password: 'Test123!',
    role: 'customer',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1555555555'
  }
];

async function getAuthUserByEmail(email) {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    
    return users.find(user => user.email === email);
  } catch (error) {
    console.error(`Error finding auth user for ${email}:`, error.message);
    return null;
  }
}

async function createUserProfile(userData) {
  const { email, password, role, firstName, lastName, phone } = userData;
  
  try {
    console.log(`\n🔄 Processing user: ${email}`);
    
    // Step 1: Find existing auth user
    const authUser = await getAuthUserByEmail(email);
    if (!authUser) {
      console.log(`❌ No auth user found for ${email} - skipping`);
      return { success: false, error: 'Auth user not found' };
    }
    
    console.log(`✅ Found auth user: ${authUser.id}`);
    
    // Step 2: Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();
    
    if (existingProfile && !checkError) {
      console.log(`✅ Profile already exists: ${existingProfile.id}`);
      return { 
        success: true, 
        authUser, 
        profileUser: existingProfile,
        created: false 
      };
    }
    
    // Step 3: Create profile in custom users table
    // Note: No password_hash needed since Supabase Auth handles authentication
    
    const { data: profileUser, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authUser.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        is_verified: true
      })
      .select()
      .single();
    
    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }
    
    console.log(`✅ Profile created: ${profileUser.id}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: ${role}`);
    console.log(`🆔 Auth ID: ${authUser.id}`);
    console.log(`🏷️ Profile ID: ${profileUser.id}`);
    
    return {
      authUser,
      profileUser,
      success: true,
      created: true
    };
    
  } catch (error) {
    console.error(`❌ Failed to process user ${email}:`, error.message);
    return {
      error: error.message,
      success: false
    };
  }
}

async function fixUserProfiles() {
  console.log('🔧 Fixing User Profiles');
  console.log('=======================');
  
  // Test Supabase connection
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection verified');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    process.exit(1);
  }
  
  const results = [];
  
  // Process each user
  for (const userData of EXPECTED_USERS) {
    const result = await createUserProfile(userData);
    results.push({ ...userData, ...result });
    
    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 Profile Fix Summary');
  console.log('======================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const created = results.filter(r => r.success && r.created);
  const existing = results.filter(r => r.success && !r.created);
  
  console.log(`✅ Successfully processed: ${successful.length} users`);
  console.log(`🆕 Created profiles: ${created.length} users`);
  console.log(`📋 Already existed: ${existing.length} users`);
  console.log(`❌ Failed: ${failed.length} users`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Available Users:');
    successful.forEach(user => {
      const status = user.created ? '(CREATED)' : '(EXISTING)';
      console.log(`  📧 ${user.email} (${user.role}) ${status}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️ Failed Users:');
    failed.forEach(user => {
      console.log(`  📧 ${user.email}: ${user.error}`);
    });
  }
  
  console.log('\n🔐 Login Credentials:');
  console.log('====================');
  successful.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });
  
  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. Start your backend server: cd server && node src/server.js');
  console.log('2. Test authentication with the credentials above');
  console.log('3. Create some categories and products for testing');
}

// Handle script execution
if (require.main === module) {
  fixUserProfiles()
    .then(() => {
      console.log('\n✅ Profile fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Profile fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createUserProfile, fixUserProfiles };