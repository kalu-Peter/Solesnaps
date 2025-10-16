const { query } = require('../src/config/database');

async function checkCategoriesAndTestQuery() {
  try {
    console.log('Checking categories table...');
    const categoriesResult = await query('SELECT COUNT(*) as count FROM categories');
    console.log(`Total categories: ${categoriesResult.rows[0].count}`);
    
    if (categoriesResult.rows[0].count > 0) {
      console.log('Sample categories:');
      const sampleCategories = await query('SELECT * FROM categories LIMIT 3');
      sampleCategories.rows.forEach(cat => {
        console.log(`- ${cat.name} (id: ${cat.id})`);
      });
    }
    
    console.log('\nTesting the products query directly...');
    const testQuery = `
      SELECT 
        p.id, p.name, p.description, p.price, p.stock_quantity,
        p.brand, p.colors, p.sizes, p.is_featured, p.is_active,
        p.created_at, p.updated_at,
        c.name as category_name, c.id as category_id,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.url,
              'alt_text', pi.alt_text,
              'is_primary', pi.is_primary,
              'sort_order', pi.sort_order
            ) ORDER BY pi.is_primary DESC, pi.sort_order ASC
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.is_active = true
      GROUP BY p.id, c.id, c.name
      ORDER BY p.created_at desc
      LIMIT 10 OFFSET 0
    `;
    
    const result = await query(testQuery);
    console.log(`Query executed successfully! Returned ${result.rows.length} products.`);
    
    if (result.rows.length > 0) {
      console.log('Sample product:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
  process.exit(0);
}

checkCategoriesAndTestQuery();