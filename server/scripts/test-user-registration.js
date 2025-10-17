const fetch = require('node-fetch');

async function testUserRegistration() {
  console.log('🧪 Testing User Registration with Supabase...\n');
  
  const testUser = {
    first_name: 'Test',
    last_name: 'User',
    email: `test${Date.now()}@example.com`, // Unique email
    password: 'TestPassword123!'
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ User registration successful!');
      console.log('📧 Email:', testUser.email);
      console.log('👤 User ID:', data.user.id);
      console.log('🔑 Access Token:', data.tokens.access_token ? 'Generated' : 'Missing');
      console.log('\n🎉 User should now be visible in your Supabase dashboard!');
      console.log('📋 Check: https://supabase.com/dashboard/project/grqfmikvwbrvkwzdquul/auth/users');
    } else {
      console.log('❌ Registration failed:', data.message || data.error);
      console.log('Response:', data);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

if (require.main === module) {
  testUserRegistration();
}

module.exports = { testUserRegistration };