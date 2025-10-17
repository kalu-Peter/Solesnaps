#!/usr/bin/env node

/**
 * Database Schema Inspector
 * Checks what tables and columns exist in Supabase
 */

const { supabaseAdmin } = require('../src/config/supabase');
require('dotenv').config();

async function inspectSchema() {
  console.log('🔍 Inspecting Supabase Database Schema');
  console.log('======================================');
  
  try {
    // Check if users table exists and get its structure
    console.log('\n📋 Checking users table...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table exists');
      if (users && users.length > 0) {
        console.log('📝 Sample user columns:', Object.keys(users[0]));
      } else {
        console.log('📝 Table exists but is empty');
      }
    }
    
    // Try to get table schema using a different approach
    console.log('\n📋 Attempting to describe users table structure...');
    try {
      const { data: schemaData, error: schemaError } = await supabaseAdmin
        .rpc('get_table_columns', { table_name: 'users' });
      
      if (schemaError) {
        console.log('❌ Schema RPC error:', schemaError.message);
      } else {
        console.log('✅ Table columns:', schemaData);
      }
    } catch (rpcError) {
      console.log('⚠️ RPC method not available');
    }
    
    // Check other expected tables
    const tablesToCheck = ['categories', 'products', 'orders', 'cart'];
    
    for (const tableName of tablesToCheck) {
      console.log(`\n📋 Checking ${tableName} table...`);
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName} table error:`, error.message);
        } else {
          console.log(`✅ ${tableName} table exists`);
          if (data && data.length > 0) {
            console.log(`📝 Sample columns:`, Object.keys(data[0]));
          }
        }
      } catch (e) {
        console.log(`❌ ${tableName} table check failed:`, e.message);
      }
    }
    
    // Try a direct SQL query to get table information
    console.log('\n📋 Attempting direct schema query...');
    try {
      const { data: tableInfo, error: tableError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');
      
      if (tableError) {
        console.log('❌ Schema query error:', tableError.message);
      } else {
        console.log('✅ Public tables found:', tableInfo.map(t => t.table_name));
      }
    } catch (e) {
      console.log('⚠️ Direct schema query not available');
    }
    
  } catch (error) {
    console.error('❌ Schema inspection failed:', error.message);
  }
}

// Handle script execution
if (require.main === module) {
  inspectSchema()
    .then(() => {
      console.log('\n✅ Schema inspection completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Schema inspection failed:', error.message);
      process.exit(1);
    });
}