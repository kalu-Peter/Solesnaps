import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nygcjmpamvhvlfzgvfgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Z2NqbXBhbXZodmxmemd2ZmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MTQzMzMsImV4cCI6MjA0OTk5MDMzM30.qTuPTZE3TaxGWp4hPIb5ZZTBUiPpDCOQVzZUOlVOjIo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugOrders() {
  console.log('=== DEBUGGING ORDERS ===');
  
  // Check all orders
  const { data: allOrders, error: allError } = await supabase
    .from('orders')
    .select('*');
    
  console.log('All orders:', allOrders);
  console.log('All orders error:', allError);
  
  // Check specific user orders
  const userId = '254eb5ee-33bc-4c91-86e9-40efffdcfe74';
  const { data: userOrders, error: userError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId);
    
  console.log('\nUser orders for', userId, ':', userOrders);
  console.log('User orders error:', userError);
  
  // Check users table to make sure the user exists
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId);
    
  console.log('\nUser data:', users);
  console.log('User error:', usersError);
}

debugOrders().catch(console.error);