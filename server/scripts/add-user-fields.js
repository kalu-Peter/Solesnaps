// Database migration script to add date_of_birth and gender fields
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5054,
  database: process.env.DB_NAME || 'soledb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'webwiz',
};

async function addMissingFields() {
  const client = new Pool(dbConfig);
  
  try {
    console.log('🔧 Adding missing fields to users table...');
    
    // Add date_of_birth column if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS date_of_birth DATE
    `);
    
    // Add gender column if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other'))
    `);
    
    console.log('✅ Successfully added date_of_birth and gender fields');
    console.log('📋 Updated table structure:');
    
    // Show current table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  addMissingFields();
}

module.exports = { addMissingFields };