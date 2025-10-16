// Test the API endpoints directly using built-in http module
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const responseData = JSON.parse(body);
          resolve({ status: res.statusCode, data: responseData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPIEndpoints() {
  try {
    console.log('🧪 Testing API Endpoints...\n');

    // 1. Test login
    console.log('1️⃣ Testing login...');
    // Try different passwords
    const passwords = ['admin123', 'password123', 'admin', 'password'];
    let loginSuccess = false;
    let token = null;

    for (const password of passwords) {
      console.log(`   Trying password: ${password}`);
      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }, {
        email: 'jane.smith@example.com',
        password: password
      });

      if (loginResponse.status === 200) {
        console.log(`✅ Login successful with password: ${password}`);
        token = loginResponse.data.data.access_token;
        loginSuccess = true;
        break;
      } else {
        console.log(`   ❌ Failed with password: ${password}`);
      }
    }

    if (loginSuccess) {
      
      // 2. Test fetching orders
      console.log('\n2️⃣ Testing fetch orders...');
      const ordersResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (ordersResponse.status === 200) {
        console.log('✅ Fetch orders successful');
        const orders = ordersResponse.data.data.orders;
        console.log(`   Found ${orders.length} orders`);
        
        if (orders.length > 0) {
          const testOrder = orders[0];
          console.log(`   Test order: #${testOrder.id} (${testOrder.status})`);
          
          // 3. Test updating order status
          console.log('\n3️⃣ Testing order status update...');
          const newStatus = testOrder.status === 'pending' ? 'processing' : 'pending';
          
          const updateResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: `/api/orders/${testOrder.id}/status`,
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }, {
            status: newStatus,
            notes: 'Updated via API test'
          });

          if (updateResponse.status === 200) {
            console.log('✅ Order status update successful');
            console.log(`   Updated to: ${updateResponse.data.data.order.status}`);
            console.log(`   Response: ${updateResponse.data.message}`);
            
            // 4. Verify the update
            console.log('\n4️⃣ Verifying the update...');
            const verifyResponse = await makeRequest({
              hostname: 'localhost',
              port: 5000,
              path: `/api/orders/${testOrder.id}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (verifyResponse.status === 200) {
              const updatedOrder = verifyResponse.data.data.order;
              console.log('✅ Verification successful');
              console.log(`   Current status: ${updatedOrder.status}`);
              console.log(`   Last updated: ${new Date(updatedOrder.updated_at).toLocaleString()}`);
              console.log(`   Notes: ${updatedOrder.notes || 'No notes'}`);
            } else {
              console.log('❌ Verification failed');
              console.log(`   Status: ${verifyResponse.status}`);
              console.log(`   Response: ${JSON.stringify(verifyResponse.data, null, 2)}`);
            }
          } else {
            console.log('❌ Order status update failed');
            console.log(`   Status: ${updateResponse.status}`);
            console.log(`   Response: ${JSON.stringify(updateResponse.data, null, 2)}`);
          }
        } else {
          console.log('❌ No orders available for testing');
        }
      } else {
        console.log('❌ Fetch orders failed');
        console.log(`   Status: ${ordersResponse.status}`);
        console.log(`   Response: ${JSON.stringify(ordersResponse.data, null, 2)}`);
      }
    } else {
      console.log('❌ Login failed with all passwords');
    }

    console.log('\n🎉 API endpoint test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPIEndpoints();