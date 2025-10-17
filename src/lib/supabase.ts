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
        categories(name, slug),
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