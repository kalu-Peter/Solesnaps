// Test creating a user through registration and then making them admin
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
          resolve({ status: res.statusCode, data: responseData });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

async function createAndTestAdmin() {
  try {
    console.log('🧪 Creating test admin and testing status updates...\n');

    // 1. Register a new user
    console.log('1️⃣ Registering new user...');
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      first_name: 'Test',
      last_name: 'Admin',
      email: 'testadmin2@solesnaps.com',
      password: 'test123'
    });

    if (registerResponse.status === 201) {
      console.log('✅ User registered successfully');
      const userId = registerResponse.data.user.id;
      
      // 2. Make the user an admin in the database
      console.log('\n2️⃣ Making user admin...');
      const { query } = require('./server/src/config/database');
      await query('UPDATE users SET role = $1 WHERE id = $2', ['admin', userId]);
      console.log('✅ User made admin');
      
      // 3. Login as the new admin
      console.log('\n3️⃣ Logging in as admin...');
      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }, {
        email: 'testadmin2@solesnaps.com',
        password: 'test123'
      });

      if (loginResponse.status === 200) {
        console.log('✅ Login successful');
        const token = loginResponse.data.data.access_token;
        
        // 4. Test the status update functionality
        console.log('\n4️⃣ Testing order status updates...');
        
        // Fetch orders
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
          const orders = ordersResponse.data.data.orders;
          console.log(`   Found ${orders.length} orders`);
          
          if (orders.length > 0) {
            const testOrder = orders[0];
            console.log(`   Testing with Order #${testOrder.id} (${testOrder.status})`);
            
            // Test multiple status updates to simulate the frontend buttons
            const statusUpdates = ['processing', 'shipped', 'completed'];
            
            for (const newStatus of statusUpdates) {
              console.log(`\n   🔄 Updating to: ${newStatus}`);
              
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
                notes: `Updated to ${newStatus} via frontend test`
              });

              if (updateResponse.status === 200) {
                console.log(`   ✅ Successfully updated to: ${newStatus}`);
                console.log(`      Response: ${updateResponse.data.message}`);
                
                // Wait a bit before next update
                await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                console.log(`   ❌ Failed to update to: ${newStatus}`);
                console.log(`      Status: ${updateResponse.status}`);
                console.log(`      Response: ${JSON.stringify(updateResponse.data, null, 2)}`);
              }
            }
            
            // Final verification
            console.log('\n5️⃣ Final verification...');
            const finalResponse = await makeRequest({
              hostname: 'localhost',
              port: 5000,
              path: `/api/orders/${testOrder.id}`,
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (finalResponse.status === 200) {
              const finalOrder = finalResponse.data.data.order;
              console.log('✅ Final verification successful');
              console.log(`   Final status: ${finalOrder.status}`);
              console.log(`   Last updated: ${new Date(finalOrder.updated_at).toLocaleString()}`);
              console.log(`   Notes: ${finalOrder.notes || 'No notes'}`);
            }
          } else {
            console.log('   ❌ No orders available for testing');
          }
        } else {
          console.log('❌ Failed to fetch orders');
        }
      } else {
        console.log('❌ Login failed');
        console.log(`   Status: ${loginResponse.status}`);
        console.log(`   Response: ${JSON.stringify(loginResponse.data, null, 2)}`);
      }
    } else {
      console.log('❌ Registration failed');
      console.log(`   Status: ${registerResponse.status}`);
      console.log(`   Response: ${JSON.stringify(registerResponse.data, null, 2)}`);
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

createAndTestAdmin();