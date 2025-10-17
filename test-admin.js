// Quick test script to check admin endpoints
const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          json: () => JSON.parse(data)
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAdminEndpoints() {
  try {
    // First, login to get a token
    console.log('1. Attempting login...');
    const loginResponse = await makeRequest('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    if (loginResponse.status !== 200) {
      console.log('Login failed:', loginResponse.status, loginResponse.data);
      return;
    }

    const loginData = loginResponse.json();
    const token = loginData.tokens?.access_token;
    
    if (!token) {
      console.log('No token received from login:', loginData);
      return;
    }

    console.log('✅ Login successful, token received');

    // Test admin products endpoint
    console.log('2. Testing /admin/products...');
    const productsResponse = await makeRequest('http://localhost:8080/admin/products?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Products response status:', productsResponse.status);
    
    if (productsResponse.status !== 200) {
      console.log('❌ Products error:', productsResponse.data);
    } else {
      const productsData = productsResponse.json();
      console.log('✅ Products success:', {
        message: productsData.message,
        productCount: productsData.data?.products?.length || 0,
        pagination: productsData.data?.pagination
      });
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testAdminEndpoints();