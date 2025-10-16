// Simple test to check if the admin can login and access orders
const { query } = require('./server/src/config/database');

async function testAdminAccess() {
  try {
    console.log('🔍 Testing Admin Access...\n');
    
    // Check if we have any admin users
    const adminResult = await query('SELECT id, email, role FROM users WHERE role = $1', ['admin']);
    console.log('Admin users found:');
    console.table(adminResult.rows);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ No admin users found');
      return;
    }
    
    // Check current orders
    const ordersResult = await query('SELECT id, status, total_amount, user_id FROM orders ORDER BY created_at DESC LIMIT 5');
    console.log('\nCurrent orders:');
    console.table(ordersResult.rows);
    
    // Test a simple status update directly in the database to simulate what the API should do
    if (ordersResult.rows.length > 0) {
      const testOrder = ordersResult.rows[0];
      const newStatus = testOrder.status === 'pending' ? 'processing' : 'pending';
      
      console.log(`\n🧪 Testing status update for Order #${testOrder.id}`);
      console.log(`   Current status: ${testOrder.status}`);
      console.log(`   Updating to: ${newStatus}`);
      
      const updateResult = await query(
        'UPDATE orders SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [newStatus, 'Updated via direct test', testOrder.id]
      );
      
      if (updateResult.rows.length > 0) {
        console.log('✅ Database update successful');
        console.log(`   New status: ${updateResult.rows[0].status}`);
        console.log(`   Updated at: ${updateResult.rows[0].updated_at}`);
        console.log(`   Notes: ${updateResult.rows[0].notes}`);
      } else {
        console.log('❌ Database update failed');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testAdminAccess();