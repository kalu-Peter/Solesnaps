const { query } = require('./server/src/config/database');

async function checkUsersAndTestUpdate() {
  try {
    console.log('🔍 Checking available users...\n');
    
    // Check users
    const usersResult = await query('SELECT id, email, role FROM users');
    console.log('Available users:');
    console.table(usersResult.rows);
    
    // Check orders
    console.log('\n🔍 Checking available orders...\n');
    const ordersResult = await query('SELECT id, status, total_amount, created_at FROM orders ORDER BY created_at DESC LIMIT 3');
    console.log('Recent orders:');
    console.table(ordersResult.rows);
    
    // Make the first user an admin if they aren't already
    if (usersResult.rows.length > 0) {
      const firstUser = usersResult.rows[0];
      if (firstUser.role !== 'admin') {
        await query('UPDATE users SET role = $1 WHERE id = $2', ['admin', firstUser.id]);
        console.log(`\n✅ Updated user ${firstUser.email} to admin role`);
      }
      
      // Now let's directly test the update status function
      console.log('\n🧪 Testing order status update directly...\n');
      
      const ordersController = require('./server/src/controllers/orders');
      
      // Mock request and response objects
      const mockReq = {
        params: { id: '5' },
        body: { 
          status: 'confirmed', 
          notes: 'Order confirmed by admin - direct test' 
        },
        user: { 
          id: firstUser.id, 
          role: 'admin' 
        }
      };
      
      const mockRes = {
        json: function(data) {
          console.log('✅ Response from updateOrderStatus:');
          console.log(JSON.stringify(data, null, 2));
          return this;
        },
        status: function(code) {
          console.log(`Response status: ${code}`);
          return this;
        }
      };
      
      // Call the update function directly
      await ordersController.updateOrderStatus(mockReq, mockRes);
      
      // Check the database to see if it was updated
      console.log('\n📊 Checking database after update...\n');
      const updatedOrderResult = await query('SELECT id, status, notes, updated_at FROM orders WHERE id = $1', [5]);
      console.log('Order after update:');
      console.table(updatedOrderResult.rows);
      
    } else {
      console.log('❌ No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

checkUsersAndTestUpdate();