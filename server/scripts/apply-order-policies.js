// Script to apply the order insert policies migration
const { supabase } = require('../src/lib/supabase');
const fs = require('fs');
const path = require('path');

async function applyOrderPolicies() {
  try {
    console.log('🔗 Applying order insert policies...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/0004_add_order_insert_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      throw error;
    }
    
    console.log('✅ Order insert policies applied successfully!');
    
  } catch (error) {
    console.error('💥 Failed to apply migration:', error.message);
    process.exit(1);
  }
}

applyOrderPolicies();