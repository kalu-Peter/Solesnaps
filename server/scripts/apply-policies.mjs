// Apply order policies via Supabase client
import { supabase } from '../../src/lib/supabase';

const applyOrderPolicies = async () => {
  if (!supabase) {
    console.error('Supabase not configured');
    return;
  }

  try {
    console.log('Applying order insert policies...');

    // Apply insert policy for orders
    const ordersPolicy = `
      CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT 
      WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id))
    `;

    const { error: ordersError } = await supabase.rpc('exec_sql', { 
      sql: ordersPolicy 
    });

    if (ordersError) {
      console.error('Error creating orders policy:', ordersError);
    } else {
      console.log('✅ Orders insert policy created');
    }

    // Apply insert policy for order_items
    const orderItemsPolicy = `
      CREATE POLICY "Users can create order items for own orders" ON public.order_items FOR INSERT 
      WITH CHECK (
        auth.uid() = (SELECT u.auth_id FROM public.users u JOIN public.orders o ON u.id = o.user_id WHERE o.id = order_id)
      )
    `;

    const { error: itemsError } = await supabase.rpc('exec_sql', { 
      sql: orderItemsPolicy 
    });

    if (itemsError) {
      console.error('Error creating order items policy:', itemsError);
    } else {
      console.log('✅ Order items insert policy created');
    }

    console.log('🎉 All policies applied successfully!');

  } catch (error) {
    console.error('Failed to apply policies:', error);
  }
};

// Execute if run directly
if (require.main === module) {
  applyOrderPolicies();
}

module.exports = applyOrderPolicies;