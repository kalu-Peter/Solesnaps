import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey ? 
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }) : null;

// Helper to check if Supabase is configured
export const isSupabaseEnabled = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
};

// Auth helpers for Supabase
export const supabaseAuth = {
  // Sign up new user
  signUp: async (email: string, password: string, metadata?: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    return { data, error };
  },

  // Sign in user
  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { data, error };
  },

  // Sign out user
  signOut: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: () => {
    if (!supabase) return Promise.resolve({ data: { user: null }, error: null });
    return supabase.auth.getUser();
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!supabase) return () => {};
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  }
};

// Database helpers for common operations
export const supabaseDb = {
  // Get products
  getProducts: async (filters?: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    let query = supabase
      .from('products')
      .select(`
        *,
        categories(id, name),
        product_images(*)
      `);

    // is_active filter: if provided, use it. If include_inactive is true, skip filtering by is_active
    if (filters && Object.prototype.hasOwnProperty.call(filters, 'is_active')) {
      query = query.eq('is_active', filters.is_active);
    } else if (filters?.include_inactive) {
      // Do not filter by is_active — return both active and inactive
    } else {
      // Default behavior: only active products
      query = query.eq('is_active', true);
    }

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters?.featured) {
      query = query.eq('is_featured', true);
    }

    // Search across name and description
    if (filters?.search) {
      const s = filters.search;
      query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query.order('created_at', { ascending: false });
  },

  // Get single product
  getProduct: async (slug: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('products')
      .select(`
        *,
        categories(name, slug),
        product_images(*),
        reviews(*, users(first_name, last_name))
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
  },

  // Get categories
  getCategories: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
  },

  // Get user cart
  getCart: async (userId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('cart')
      .select(`
        *,
        products(*, product_images(*))
      `)
      .eq('user_id', userId);
  },

  // Add to cart
  addToCart: async (userId: string, productId: string, quantity: number, size?: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('cart')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity,
        size
      }, {
        onConflict: 'user_id,product_id,size'
      });
  },

  // Update cart item
  updateCartItem: async (userId: string, productId: string, quantity: number, size?: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('cart')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('size', size || null);
  },

  // Remove from cart
  removeFromCart: async (userId: string, productId: string, size?: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('size', size || null);
  },

  // Clear cart
  clearCart: async (userId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId);
  },

  // Get orders
  getOrders: async (filters?: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    console.log('SupabaseDb.getOrders - received filters:', filters);
    console.log('SupabaseDb.getOrders - filters.userId:', filters?.userId);
    console.log('SupabaseDb.getOrders - typeof filters.userId:', typeof filters?.userId);
    
    // First, let's check if the user exists in the users table
    if (filters?.userId) {
      console.log('Checking if user exists in users table...');
      console.log('Looking for user with ID:', filters.userId);
      
      const { data: userCheck, error: userError } = await supabase
        .from('users')
        .select('id, auth_id, email, first_name, last_name')
        .eq('id', filters.userId);
      
      console.log('User check (by id) result:', userCheck);
      console.log('User check (by id) error:', userError);
      
      // Also check by auth_id in case they're different
      const { data: authUserCheck, error: authUserError } = await supabase
        .from('users')
        .select('id, auth_id, email, first_name, last_name')
        .eq('auth_id', filters.userId);
      
      console.log('Auth user check (by auth_id) result:', authUserCheck);
      console.log('Auth user check (by auth_id) error:', authUserError);
      
      // Also get all users to see what's in the table
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id, auth_id, email, first_name, last_name');
      
      console.log('All users in database:', allUsers);
      console.log('All users error:', allUsersError);
    }
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*,
          products(*, product_images(*))
        ),
        users(first_name, last_name, email)
      `);

    // Before applying filters, let's see all orders to debug
    if (filters?.userId) {
      console.log('Before filtering - checking all orders...');
      const { data: allOrdersForDebug, error: allOrdersError } = await supabase
        .from('orders')
        .select('id, user_id, order_number, status, total_amount, created_at');
      
      console.log('All orders in database:', allOrdersForDebug);
      console.log('All orders error:', allOrdersError);
      
      if (allOrdersForDebug && allOrdersForDebug.length > 0) {
        console.log('Sample order user_ids:');
        allOrdersForDebug.slice(0, 5).forEach((order, index) => {
          console.log(`Order ${index + 1}: id=${order.id}, user_id="${order.user_id}" (type: ${typeof order.user_id}), order_number=${order.order_number}`);
        });
        
        // Check if any orders match our user ID
        const matchingOrders = allOrdersForDebug.filter(order => order.user_id === filters.userId);
        console.log(`Orders matching user ID "${filters.userId}":`, matchingOrders);
      }
    }

    if (filters?.userId) {
      console.log('SupabaseDb.getOrders - Applying user filter:', filters.userId);
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const result = await query.order('created_at', { ascending: false });
    console.log('SupabaseDb.getOrders - query result:', result);
    return result;
  },

  // Get single order
  getOrder: async (orderId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('orders')
      .select(`
        *,
        order_items(*,
          products(*, product_images(*))
        ),
        users(first_name, last_name, email)
      `)
      .eq('id', orderId)
      .single();
  },

  // Create order
  createOrder: async (orderData: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Extract order items and delivery location from the order data
    const { order_items, delivery_location, ...orderFields } = orderData;
    
    // Generate order number
    const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Create the main order record with only valid database fields
    const orderInsertData = {
      user_id: orderData.user_id,
      delivery_location_id: orderData.delivery_location_id,
      payment_method: orderData.payment_method,
      subtotal_amount: orderData.subtotal_amount,
      shipping_amount: orderData.shipping_amount,
      total_amount: orderData.total_amount,
      order_number: orderNumber,
      shipping_address: { 
        city: delivery_location?.city_name || 'N/A',
        pickup_location: delivery_location?.pickup_location || 'N/A',
        phone: delivery_location?.pickup_phone || 'N/A'
      },
      billing_address: { 
        city: delivery_location?.city_name || 'N/A',
        pickup_location: delivery_location?.pickup_location || 'N/A',
        phone: delivery_location?.pickup_phone || 'N/A'
      }
    };

    console.log('Attempting to insert order:', orderInsertData);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) {
      console.error('Order insertion error:', orderError);
      throw orderError;
    }

    // Create order items if they exist
    if (order_items && order_items.length > 0) {
      const orderItemsData = order_items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.unit_price,
        size: item.size || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) {
        // If order items creation fails, we should clean up the order
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }
    }

    return { data: order, error: null };
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
  },

  // Get users
  getUsers: async (filters?: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    let query = supabase
      .from('users')
      .select('*');

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query.order('created_at', { ascending: false });
  },

  // Get single user
  getUser: async (userId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
  },

  // Create user
  createUser: async (userData: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
  },

  // Update user
  updateUser: async (userId: string, userData: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
      .select()
      .single();
  },

  // Delete user
  deleteUser: async (userId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('users')
      .delete()
      .eq('id', userId);
  },

  // Get delivery locations
  getDeliveryLocations: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('delivery_locations')
      .select('*')
      .order('city_name');
  },

  // Create delivery location
  createDeliveryLocation: async (locationData: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('delivery_locations')
      .insert(locationData)
      .select()
      .single();
  },

  // Update delivery location
  updateDeliveryLocation: async (locationId: string, locationData: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('delivery_locations')
      .update(locationData)
      .eq('id', locationId)
      .select()
      .single();
  },

  // Delete delivery location
  deleteDeliveryLocation: async (locationId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('delivery_locations')
      .delete()
      .eq('id', locationId);
  },

  // Create product
  createProduct: async (productData: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
  },

  // Update product
  updateProduct: async (productId: string, productData: any) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();
  },

  // Delete product
  deleteProduct: async (productId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    return await supabase
      .from('products')
      .delete()
      .eq('id', productId);
  },

  // Upload product image
  uploadProductImage: async (file: File, productId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Sanitize the filename to remove invalid characters
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    
    const fileName = `${productId}/${Date.now()}-${sanitizedFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    // Save to product_images table
    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: urlData.publicUrl,  // Changed from image_url to url
        alt_text: file.name
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Real-time subscriptions
  subscribeToTable: (table: string, callback: (payload: any) => void) => {
    if (!supabase) return null;
    
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }
};

export default supabase;