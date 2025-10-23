const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - you'll need to set these
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('Please set VITE_SUPABASE_URL environment variable');
  process.exit(1);
}

if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY') {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleOrders() {
  try {
    console.log('Creating sample orders...');

    // First, let's check if we have any users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users?.length || 0} users`);

    if (!users || users.length === 0) {
      console.log('No users found. Creating a sample user first...');
      
      // Create a sample user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          role: 'customer'
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        return;
      }

      users.push(newUser);
      console.log('Created sample user:', newUser);
    }

    // Now create some sample orders
    const sampleOrders = [
      {
        user_id: users[0].id,
        order_number: `ORDER-${Date.now()}-001`,
        status: 'pending',
        payment_method: 'card',
        payment_status: 'pending',
        total_amount: 5999.00,
        subtotal_amount: 5999.00,
        shipping_amount: 0,
        shipping_address: {
          city: 'Nairobi',
          pickup_location: 'CBD',
          phone: '+254700123456'
        },
        billing_address: {
          city: 'Nairobi',
          pickup_location: 'CBD',
          phone: '+254700123456'
        }
      },
      {
        user_id: users[0].id,
        order_number: `ORDER-${Date.now()}-002`,
        status: 'processing',
        payment_method: 'mpesa',
        payment_status: 'paid',
        total_amount: 12500.00,
        subtotal_amount: 11500.00,
        shipping_amount: 1000.00,
        shipping_address: {
          city: 'Mombasa',
          pickup_location: 'Town',
          phone: '+254700123456'
        },
        billing_address: {
          city: 'Mombasa',
          pickup_location: 'Town',
          phone: '+254700123456'
        }
      }
    ];

    if (users.length > 1) {
      sampleOrders.push({
        user_id: users[1].id,
        order_number: `ORDER-${Date.now()}-003`,
        status: 'shipped',
        payment_method: 'card',
        payment_status: 'paid',
        total_amount: 8999.00,
        subtotal_amount: 8999.00,
        shipping_amount: 0,
        tracking_number: 'TRK123456789',
        shipping_address: {
          city: 'Kisumu',
          pickup_location: 'Market',
          phone: '+254700987654'
        },
        billing_address: {
          city: 'Kisumu',
          pickup_location: 'Market',
          phone: '+254700987654'
        }
      });
    }

    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .insert(sampleOrders)
      .select();

    if (orderError) {
      console.error('Error creating orders:', orderError);
      return;
    }

    console.log(`Created ${orders?.length || 0} sample orders`);

    // Now let's verify by fetching orders with user data
    const { data: ordersWithUsers, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        users(first_name, last_name, email)
      `)
      .limit(5);

    if (fetchError) {
      console.error('Error fetching orders with users:', fetchError);
    } else {
      console.log('Orders with user data:');
      ordersWithUsers?.forEach((order, i) => {
        console.log(`Order ${i + 1}:`, {
          id: order.id,
          order_number: order.order_number,
          user_id: order.user_id,
          user: order.users,
          total: order.total_amount,
          status: order.status
        });
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

createSampleOrders();