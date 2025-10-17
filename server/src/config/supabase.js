const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for server
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // For client-side operations

// Create Supabase client for server-side operations (with service role)
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) : null;

// Create Supabase client for regular operations (with anon key)
const supabase = supabaseUrl && supabaseAnonKey ? 
  createClient(supabaseUrl, supabaseAnonKey) : null;

// Test Supabase connection
const testSupabaseConnection = async () => {
  if (!supabase) {
    console.log('⚠️  Supabase not configured - using local PostgreSQL');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};

// Helper function to execute raw SQL queries on Supabase
const supabaseQuery = async (query, params = []) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  try {
    // For raw SQL queries, we'll use the RPC function or direct table operations
    // This is a placeholder - Supabase prefers table operations over raw SQL
    console.warn('Raw SQL queries should be converted to Supabase table operations');
    throw new Error('Raw SQL not directly supported - use table operations instead');
  } catch (error) {
    console.error('Supabase query error:', error.message);
    throw error;
  }
};

// Helper to determine if we should use Supabase
const isSupabaseEnabled = () => {
  return !!(supabaseUrl && (supabaseServiceKey || supabaseAnonKey));
};

// Export both clients and utilities
module.exports = {
  supabase,           // Client with anon key (for auth, public operations)
  supabaseAdmin,      // Client with service role (for admin operations)
  testSupabaseConnection,
  supabaseQuery,
  isSupabaseEnabled,
  
  // Configuration values
  config: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    serviceKey: supabaseServiceKey
  }
};