#!/usr/bin/env node

/**
 * Setup Users Script for Supabase
 * Creates admin and customer users in Supabase Auth and custom users table
 */

const { supabaseAdmin } = require('../src/config/supabase');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User configurations
const USERS = [
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

async function createUser(userData) {
  const { email, password, role, firstName, lastName, phone } = userData;
  
  try {
    console.log(`\n🔄 Creating ${role} user: ${email}`);
    
    // Step 1: Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role,
        first_name: firstName,
        last_name: lastName
      }
    });
    
    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`);
    }
    
    console.log(`✅ Supabase Auth user created: ${authUser.user.id}`);
    
    // Step 2: Create profile in custom users table
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const { data: profileUser, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authUser.user.id,
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        email_verified: true,
        is_active: true
      })
      .select()
      .single();
    
    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }
    
    console.log(`✅ User profile created: ${profileUser.id}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: ${role}`);
    console.log(`🆔 Auth ID: ${authUser.user.id}`);
    console.log(`🏷️ Profile ID: ${profileUser.id}`);
    
    return {
      authUser: authUser.user,
      profileUser,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ Failed to create user ${email}:`, error.message);
    
    // Try to clean up if auth user was created but profile failed
    if (error.message.includes('Profile creation failed')) {
      try {
        console.log('🧹 Cleaning up orphaned auth user...');
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        console.log('🗑️ Orphaned auth user cleaned up');
      } catch (cleanupError) {
        console.error('⚠️ Failed to cleanup auth user:', cleanupError.message);
      }
    }
    
    return {
      error: error.message,
      success: false
    };
  }
}

async function setupUsers() {
  console.log('🚀 Starting Supabase User Setup');
  console.log('================================');
  
  // Test Supabase connection first
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection verified');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('\n⚠️ Make sure you have:');
    console.log('  1. Run the migration script in Supabase SQL Editor');
    console.log('  2. Set correct SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('  3. Enabled Row Level Security policies');
    process.exit(1);
  }
  
  const results = [];
  
  // Create each user
  for (const userData of USERS) {
    const result = await createUser(userData);
    results.push({ ...userData, ...result });
    
    // Small delay between user creations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 User Setup Summary');
  console.log('====================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully created: ${successful.length} users`);
  console.log(`❌ Failed: ${failed.length} users`);
  
  if (successful.length > 0) {
    console.log('\n🎉 Created Users:');
    successful.forEach(user => {
      console.log(`  📧 ${user.email} (${user.role})`);
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
  console.log('1. Test login with the credentials above');
  console.log('2. Start your backend server: npm start');
  console.log('3. Test authentication endpoints');
  console.log('4. Create some test products and categories');
}

// Handle script execution
if (require.main === module) {
  setupUsers()
    .then(() => {
      console.log('\n✅ User setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ User setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createUser, setupUsers };