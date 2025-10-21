import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://grqfmikvwbrvkwzdquul.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycWZtaWt2d2Jydmt3emRxdXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTMwODIsImV4cCI6MjA3NjI2OTA4Mn0.C2ftj1bL1CkhpH0q0Ew4zpwWxHVUStgP-cbWEc5LKsM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔍 Testing updated query...');
    
    // Test the exact query used by getProducts
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name),
        product_images(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (productsError) {
      console.error('❌ Products error:', productsError);
      console.error('Error details:', productsError);
    } else {
      console.log('✅ Products found:', products?.length || 0);
      if (products && products.length > 0) {
        console.log('First product:', {
          id: products[0].id,
          name: products[0].name,
          category: products[0].categories,
          images: products[0].product_images?.length || 0
        });
      }
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err);
  }
}

testConnection();