const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📋 Configuration Check:');
  console.log(`Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`Anon Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`Service Key: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing required Supabase credentials');
    return false;
  }
  
  try {
    // Test with anon key (client-side operations)
    console.log('🔍 Testing Supabase API with anon key...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Anon key test result:', testError.message);
      // This might be expected if RLS is enabled and no user is authenticated
      if (testError.message.includes('RLS') || testError.message.includes('permission')) {
        console.log('✅ This is expected - RLS is working correctly');
      }
    } else {
      console.log('✅ Anon key connection successful');
    }
    
    // Test with service role key (admin operations)
    if (supabaseServiceKey) {
      console.log('\n🔧 Testing Supabase API with service role key...');
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1);
      
      if (adminError) {
        console.log('❌ Service role test failed:', adminError.message);
        if (adminError.message.includes('relation "users" does not exist')) {
          console.log('💡 The migration might not have been run yet.');
          console.log('   Please run the SQL migration in your Supabase dashboard.');
        }
      } else {
        console.log('✅ Service role connection successful');
        console.log('✅ Database tables are accessible');
      }
    }
    
    // Test authentication endpoints
    console.log('\n🔐 Testing authentication endpoints...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth test failed:', authError.message);
    } else {
      console.log('✅ Authentication endpoints working');
    }
    
    console.log('\n🎉 Supabase connection test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. If you see table/migration errors, run the migration in Supabase SQL Editor');
    console.log('2. Start your backend server: npm run dev');
    console.log('3. Start your frontend server: npm run dev (in root folder)');
    console.log('4. Check server logs for "Supabase connected successfully"');
    
    return true;
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Supabase project URL and keys');
    console.log('2. Ensure your project is active in Supabase dashboard');
    console.log('3. Verify your internet connection');
    return false;
  }
}

if (require.main === module) {
  testSupabaseConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testSupabaseConnection };