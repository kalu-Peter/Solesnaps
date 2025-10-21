import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://grqfmikvwbrvkwzdquul.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycWZtaWt2d2Jydmt3emRxdXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTMwODIsImV4cCI6MjA3NjI2OTA4Mn0.C2ftj1bL1CkhpH0q0Ew4zpwWxHVUStgP-cbWEc5LKsM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProductService() {
  try {
    console.log('🔍 Testing product service flow...');
    
    // Test categories first
    console.log('\n1. Testing categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (categoriesError) {
      console.error('❌ Categories error:', categoriesError);
    } else {
      console.log('✅ Categories found:', categories?.length || 0);
      console.log('Categories:', categories?.map(c => c.name));
      
      // Filter shoe categories like the app does
      const shoeCategories = categories?.filter(cat => {
        const name = cat.name.toLowerCase();
        return name.includes('shoe') || 
               name.includes('sneaker') ||
               name.includes('boot') ||
               name.includes('sandal') ||
               name.includes('slipper') ||
               name.includes('footwear');
      });
      
      console.log('👟 Shoe categories:', shoeCategories?.map(c => c.name));
    }
    
    // Test products
    console.log('\n2. Testing products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name),
        product_images(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (productsError) {
      console.error('❌ Products error:', productsError);
    } else {
      console.log('✅ Products found:', products?.length || 0);
      if (products && products.length > 0) {
        products.forEach((product, index) => {
          console.log(`Product ${index + 1}:`, {
            name: product.name,
            category: product.categories?.name,
            category_id: product.categories?.id,
            images: product.product_images?.length || 0
          });
        });
      }
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testProductService();