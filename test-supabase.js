const { supabaseAdmin } = require('./server/src/config/supabase');

async function testProductsQuery() {
  try {
    console.log('Testing products query...');
    
    const { data, error, count } = await supabaseAdmin
      .from('products')
      .select('id, name, description, price, stock_quantity, brand, colors, sizes, gender, is_featured, is_active, created_at, updated_at, category:categories(id,name), product_images(id,url,alt_text,is_primary,sort_order)', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(0, 4);

    if (error) {
      console.error('❌ Supabase error:', error);
    } else {
      console.log('✅ Query successful');
      console.log('Count:', count);
      console.log('Products found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('First product:', {
          id: data[0].id,
          name: data[0].name,
          price: data[0].price,
          category: data[0].category,
          images: data[0].product_images?.length || 0
        });
      }
    }
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

testProductsQuery();