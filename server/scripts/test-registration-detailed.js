const fetch = require('node-fetch');

async function testUserRegistrationDetailed() {
  console.log('🧪 Detailed User Registration Test...\n');
  
  const testUser = {
    first_name: 'Supabase',
    last_name: 'Test',
    email: `supabase${Date.now()}@example.com`,
    password: 'TestPassword123!'
  };
  
  console.log('📧 Testing with email:', testUser.email);
  console.log('🔄 Sending registration request...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.user) {
      console.log('\n🔍 Analysis:');
      console.log('User ID format:', typeof data.user.id, '(', data.user.id, ')');
      
      if (typeof data.user.id === 'string' && data.user.id.includes('-')) {
        console.log('✅ UUID format detected - likely created in Supabase!');
      } else if (typeof data.user.id === 'number') {
        console.log('⚠️  Numeric ID detected - likely created in local PostgreSQL');
      }
      
      console.log('\n📋 Next Steps:');
      console.log('1. Check Supabase Dashboard: https://supabase.com/dashboard/project/grqfmikvwbrvkwzdquul/auth/users');
      console.log('2. Check Supabase Database: https://supabase.com/dashboard/project/grqfmikvwbrvkwzdquul/editor');
      console.log('3. Look for user with email:', testUser.email);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

if (require.main === module) {
  testUserRegistrationDetailed();
}

module.exports = { testUserRegistrationDetailed };