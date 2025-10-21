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
    if (!supabase) return null;
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
      `)
      .eq('is_active', true);

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters?.featured) {
      query = query.eq('is_featured', true);
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
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*,
          products(*, product_images(*))
        ),
        users(first_name, last_name, email)
      `);

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query.order('created_at', { ascending: false });
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
    
    return await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
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
    
    const fileName = `${productId}/${Date.now()}-${file.name}`;
    
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
        image_url: urlData.publicUrl,
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