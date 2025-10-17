require('dotenv').config();

// Test the auth controller directly
const authController = require('../src/controllers/auth');
const { isSupabaseEnabled, supabaseAdmin } = require('../src/config/supabase');

console.log('🔍 Direct Auth Controller Test\n');

console.log('Supabase enabled:', isSupabaseEnabled());
console.log('Supabase admin client:', !!supabaseAdmin);

// Mock request and response objects
const mockReq = {
  body: {
    first_name: 'Direct',
    last_name: 'Test',
    email: `direct${Date.now()}@example.com`,
    password: 'TestPassword123!'
  }
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('\n📊 Response Status:', this.statusCode);
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (data.user) {
      console.log('\n🔍 User ID Analysis:');
      console.log('Type:', typeof data.user.id);
      console.log('Value:', data.user.id);
      
      if (typeof data.user.id === 'string' && data.user.id.includes('-')) {
        console.log('✅ UUID format - Supabase was used!');
      } else {
        console.log('⚠️  Numeric format - Local PostgreSQL was used');
      }
    }
  }
};

console.log('📧 Testing registration for:', mockReq.body.email);
console.log('🔄 Calling register function directly...\n');

// Call the register function directly
authController.register(mockReq, mockRes).catch(error => {
  console.error('❌ Error:', error.message);
});