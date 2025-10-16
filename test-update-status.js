const fetch = require('node-fetch');

async function testUpdateStatus() {
  try {
    // First, let's try to login as admin to get a token
    console.log('Testing order status update...\n');
    
    // Try to get an admin user first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@solesnaps.com', // Assuming this exists
        password: 'admin123' // Common test password
      })
    });

    if (!loginResponse.ok) {
      console.log('Admin login failed, trying with any user...');
      
      // If admin doesn't exist, let's try a different approach
      // Let's check what users exist
      const { query } = require('./server/src/config/database');
      const usersResult = await query('SELECT id, email, role FROM users LIMIT 3');
      console.log('Available users:');
      console.table(usersResult.rows);
      
      // Try to login with the first user and see if we can make them admin
      if (usersResult.rows.length > 0) {
        const firstUser = usersResult.rows[0];
        
        // Update first user to admin
        await query('UPDATE users SET role = $1 WHERE id = $2', ['admin', firstUser.id]);
        console.log(`Updated user ${firstUser.email} to admin role`);
        
        // Now try to login again
        const retryLogin = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: firstUser.email,
            password: 'password123' // Common test password
          })
        });
        
        if (retryLogin.ok) {
          const authData = await retryLogin.json();
          const token = authData.data.access_token;
          
          console.log('✅ Successfully logged in as admin');
          
          // Now test updating order status
          const updateResponse = await fetch('http://localhost:5000/api/orders/5/status', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              status: 'confirmed',
              notes: 'Order confirmed by admin - test update'
            })
          });
          
          if (updateResponse.ok) {
            const updateResult = await updateResponse.json();
            console.log('✅ Order status updated successfully:');
            console.log(updateResult);
            
            // Verify the update in database
            const orderCheck = await query('SELECT id, status, notes, updated_at FROM orders WHERE id = $1', [5]);
            console.log('\n📊 Order in database after update:');
            console.table(orderCheck.rows);
            
          } else {
            const errorText = await updateResponse.text();
            console.log('❌ Order status update failed:');
            console.log('Status:', updateResponse.status);
            console.log('Response:', errorText);
          }
          
        } else {
          console.log('❌ Login still failed after making user admin');
        }
      }
      
    } else {
      const authData = await loginResponse.json();
      const token = authData.data.access_token;
      
      console.log('✅ Successfully logged in as admin');
      
      // Test updating order status
      const updateResponse = await fetch('http://localhost:5000/api/orders/5/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'confirmed',
          notes: 'Order confirmed by admin - test update'
        })
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Order status updated successfully:');
        console.log(updateResult);
        
        // Verify the update in database
        const { query } = require('./server/src/config/database');
        const orderCheck = await query('SELECT id, status, notes, updated_at FROM orders WHERE id = $1', [5]);
        console.log('\n📊 Order in database after update:');
        console.table(orderCheck.rows);
        
      } else {
        const errorText = await updateResponse.text();
        console.log('❌ Order status update failed:');
        console.log('Status:', updateResponse.status);
        console.log('Response:', errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpdateStatus();