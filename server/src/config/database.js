const { Pool } = require('pg');
const { isSupabaseEnabled, testSupabaseConnection } = require('./supabase');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Force Supabase-only mode - disable local PostgreSQL
const useSupabase = true; // Always use Supabase

console.log('🌐 Database mode: SUPABASE ONLY - Local PostgreSQL disabled');

// Database configuration - Supabase only mode
// Direct database connection is disabled - using Supabase API exclusively
const dbConfig = {
  // Disable direct PostgreSQL connection pool for Supabase-only mode
  // All database operations will go through Supabase client
  host: 'disabled-using-supabase-api',
  port: 0,
  database: 'supabase-api-only',
  user: 'supabase-client',
  password: 'api-mode',
  ssl: false,
  max: 1,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 1000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool events
pool.on('connect', (client) => {
  console.log(`🔗 New client connected to ${useSupabase ? 'Supabase' : 'local'} PostgreSQL`);
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  process.exit(-1);
});

// Test database connection - Supabase API only
const testConnection = async () => {
  try {
    console.log('🌐 Testing Supabase API connection (no direct PostgreSQL)...');
    
    // Test Supabase client connection
    const supabaseTestResult = await testSupabaseConnection();
    if (supabaseTestResult) {
      console.log('✅ Supabase API client connected successfully');
      console.log('🔗 Database operations will use Supabase client exclusively');
      return true;
    } else {
      console.error('❌ Supabase API connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message);
    return false;
  }
};

// Query helper function
const query = async (text, params) => {
  // If the server is configured to use Supabase-only mode, the direct
  // PostgreSQL pool is intentionally disabled. Fail fast and return a
  // clear error to avoid long connection timeouts when legacy code still
  // calls `query()`.
  if (useSupabase) {
    const msg = 'Direct database pool is disabled in Supabase-only mode. Convert code to use supabaseAdmin.';
    console.error('❌ Query attempted while in Supabase-only mode:', { text: text && text.substring ? text.substring(0,200) : text });
    const error = new Error(msg);
    error.code = 'SUPABASE_MODE_QUERY_BLOCKED';
    throw error;
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query executed:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Close pool
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔒 Database pool closed');
  } catch (error) {
    console.error('❌ Error closing pool:', error.message);
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool,
  
  // Export configuration info
  config: {
    useSupabase,
    dbConfig,
    connectionType: useSupabase ? 'supabase' : 'local'
  }
};