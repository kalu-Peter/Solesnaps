import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nygcjmpamvhvlfzgvfgd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Z2NqbXBhbXZodmxmemd2ZmdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDQxNDMzMywiZXhwIjoyMDQ5OTkwMzMzfQ.k5ZPCczKKxdkkXP7WiPO8ILEXGNlc6uEeJ7xaJ_6sj8'; // Service key to bypass RLS

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDatabase() {
  try {
    console.log('=== DEBUGGING DATABASE ===');
    
    // Check orders table
    console.log('1. Checking orders table...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    console.log('Orders:', orders);
    console.log('Orders error:', ordersError);
    console.log('Number of orders:', orders ? orders.length : 0);
    
    // Check users table
    console.log('\n2. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
      
    console.log('Users:', users);
    console.log('Users error:', usersError);
    console.log('Number of users:', users ? users.length : 0);
    
    // Check specific user
    const userId = '254eb5ee-33bc-4c91-86e9-40efffdcfe74';
    console.log('\n3. Checking specific user:', userId);
    const { data: specificUser, error: specificUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);
      
    console.log('Specific user:', specificUser);
    console.log('Specific user error:', specificUserError);
    
    // Check orders for specific user
    console.log('\n4. Checking orders for specific user...');
    const { data: userOrders, error: userOrdersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);
      
    console.log('User orders:', userOrders);
    console.log('User orders error:', userOrdersError);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugDatabase();