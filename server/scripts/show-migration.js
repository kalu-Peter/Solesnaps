#!/usr/bin/env node

/**
 * Migration Helper Script
 * Displays the migration SQL that needs to be run in Supabase SQL Editor
 */

const fs = require('fs');
const path = require('path');

function displayMigration() {
  const migrationPath = path.join(__dirname, '..', 'migrations', '0002_supabase_schema.sql');
  
  try {
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 SUPABASE MIGRATION SCRIPT');
    console.log('============================');
    console.log('\n📋 INSTRUCTIONS:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project: grqfmikvwbrvkwzdquul');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy the SQL below and paste it into a new query');
    console.log('5. Click "Run" to execute the migration');
    console.log('\n⚠️  WARNING: This will DROP existing tables and create new ones!');
    console.log('\n📄 MIGRATION SQL:');
    console.log('==================');
    console.log(migrationSQL);
    console.log('\n✅ After running the migration, come back and run:');
    console.log('   node scripts/setup-users.js');
    
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  displayMigration();
}

module.exports = { displayMigration };