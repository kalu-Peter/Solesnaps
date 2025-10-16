// Test script to verify frontend status update functionality
const fetch = require('node-fetch');

async function testFrontendStatusUpdate() {
  try {
    console.log('🧪 Testing Frontend Status Update Functionality\n');
    
    // First, login to get a token
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@solesnaps.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const authData = await loginResponse.json();
    const token = authData.data.access_token;
    console.log('✅ Successfully logged in as admin\n');

    // 2. Fetch current orders to see available orders
    console.log('2️⃣ Fetching current orders...');
    const ordersResponse = await fetch('http://localhost:5000/api/orders?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!ordersResponse.ok) {
      throw new Error('Failed to fetch orders');
    }

    const ordersData = await ordersResponse.json();
    const orders = ordersData.data.orders;
    
    console.log('Available orders:');
    orders.forEach(order => {
      console.log(`  Order #${order.id}: ${order.status} - Ksh ${order.total_amount}`);
    });
    console.log('');

    if (orders.length === 0) {
      console.log('❌ No orders found to test with');
      return;
    }

    // 3. Test updating status of the first order
    const testOrder = orders[0];
    const currentStatus = testOrder.status;
    let newStatus;
    
    // Choose a different status to update to
    switch (currentStatus) {
      case 'pending':
        newStatus = 'processing';
        break;
      case 'processing':
        newStatus = 'shipped';
        break;
      case 'shipped':
        newStatus = 'completed';
        break;
      case 'completed':
        newStatus = 'pending'; // Reset for testing
        break;
      default:
        newStatus = 'processing';
    }

    console.log(`3️⃣ Testing status update for Order #${testOrder.id}`);
    console.log(`   Current status: ${currentStatus}`);
    console.log(`   Updating to: ${newStatus}`);

    // Test the frontend API function
    const updateResponse = await fetch(`http://localhost:5000/api/orders/${testOrder.id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus,
        notes: 'Status updated via frontend test'
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Status update failed: ${updateResponse.status} - ${errorText}`);
    }

    const updateResult = await updateResponse.json();
    console.log('✅ Status update successful!');
    console.log(`   Response: ${updateResult.message}`);
    console.log(`   New status: ${updateResult.data.order.status}\n`);

    // 4. Verify the update by fetching the order again
    console.log('4️⃣ Verifying the update...');
    const verifyResponse = await fetch(`http://localhost:5000/api/orders/${testOrder.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify order update');
    }

    const verifyData = await verifyResponse.json();
    const updatedOrder = verifyData.data.order;
    
    console.log('📊 Order verification:');
    console.log(`   Order ID: ${updatedOrder.id}`);
    console.log(`   Current Status: ${updatedOrder.status}`);
    console.log(`   Last Updated: ${new Date(updatedOrder.updated_at).toLocaleString()}`);
    console.log(`   Notes: ${updatedOrder.notes || 'No notes'}`);

    if (updatedOrder.status === newStatus) {
      console.log('✅ Status update verified successfully!');
    } else {
      console.log('❌ Status update verification failed!');
      console.log(`   Expected: ${newStatus}, Got: ${updatedOrder.status}`);
    }

    // 5. Test different status transitions
    console.log('\n5️⃣ Testing different status transitions...');
    
    const statusTransitions = [
      { from: 'pending', to: 'processing' },
      { from: 'processing', to: 'shipped' },
      { from: 'shipped', to: 'completed' }
    ];

    for (const transition of statusTransitions) {
      // Find an order with the source status or update one to have it
      let sourceOrder = orders.find(o => o.status === transition.from);
      
      if (!sourceOrder) {
        // Update the test order to the source status first
        await fetch(`http://localhost:5000/api/orders/${testOrder.id}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: transition.from,
            notes: `Set to ${transition.from} for testing transition`
          })
        });
        sourceOrder = testOrder;
      }

      console.log(`   Testing: ${transition.from} → ${transition.to}`);
      
      const transitionResponse = await fetch(`http://localhost:5000/api/orders/${sourceOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: transition.to,
          notes: `Transition test: ${transition.from} to ${transition.to}`
        })
      });

      if (transitionResponse.ok) {
        const transitionResult = await transitionResponse.json();
        console.log(`   ✅ ${transition.from} → ${transition.to}: Success`);
      } else {
        console.log(`   ❌ ${transition.from} → ${transition.to}: Failed`);
      }
    }

    console.log('\n🎉 Frontend status update test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendStatusUpdate();