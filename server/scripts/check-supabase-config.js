require('dotenv').config();
const { isSupabaseEnabled, supabaseAdmin } = require('../src/config/supabase');

console.log('🔍 Supabase Configuration Check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
console.log('isSupabaseEnabled():', isSupabaseEnabled());
console.log('supabaseAdmin client:', supabaseAdmin ? 'Available' : 'Not available');

if (supabaseAdmin) {
  console.log('\n✅ Supabase should be used for authentication');
} else {
  console.log('\n❌ Supabase is not configured, using local PostgreSQL');
}