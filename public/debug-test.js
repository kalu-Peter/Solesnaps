// Simple test page to debug the orders filtering issue
// This will be accessed via browser console

console.log('=== ORDERS DEBUG TEST ===');

// Test the supabaseDb function directly
import('./src/lib/supabase.js').then(async ({ supabaseDb }) => {
  try {
    console.log('Testing supabaseDb.getOrders...');
    
    // Test 1: Get all orders
    console.log('1. Getting all orders...');
    const allOrdersResult = await supabaseDb.getOrders({});
    console.log('All orders result:', allOrdersResult);
    
    // Test 2: Get orders for specific user
    const userId = '254eb5ee-33bc-4c91-86e9-40efffdcfe74';
    console.log('2. Getting orders for user:', userId);
    const userOrdersResult = await supabaseDb.getOrders({ userId });
    console.log('User orders result:', userOrdersResult);
    
    // Test 3: Check if user exists in users table
    console.log('3. Checking if user exists...');
    const { supabase } = await import('./src/lib/supabase.js');
    if (supabase) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);
      console.log('User data:', userData);
      console.log('User error:', userError);
      
      // Test 4: Check orders table directly
      console.log('4. Checking orders table directly...');
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*');
      console.log('Direct orders data:', ordersData);
      console.log('Direct orders error:', ordersError);
      
      // Test 5: Check orders for user directly
      console.log('5. Checking orders for user directly...');
      const { data: userOrdersData, error: userOrdersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId);
      console.log('Direct user orders data:', userOrdersData);
      console.log('Direct user orders error:', userOrdersError);
    }
    
  } catch (error) {
    console.error('Debug test error:', error);
  }
}).catch(console.error);