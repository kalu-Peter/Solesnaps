const { query } = require('../src/config/database');

async function createTestProduct() {
  try {
    console.log('Creating a test product...');
    
    const result = await query(
      `INSERT INTO products (
        name, slug, description, price, stock_quantity, category_id, brand,
        colors, sizes, is_featured, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        'Nike Air Max 90',
        'nike-air-max-90',
        'Classic comfortable running shoe with premium materials and iconic design.',
        129.99,
        25,
        1, // Sneakers category
        'Nike',
        JSON.stringify(['White', 'Black', 'Red']),
        JSON.stringify(['8', '9', '10', '11', '12']),
        true, // is_featured
        true  // is_active
      ]
    );

    console.log('✅ Test product created successfully!');
    console.log('Product ID:', result.rows[0].id);
    console.log('Product name:', result.rows[0].name);
    
  } catch (error) {
    console.error('❌ Error creating test product:', error);
  }
  process.exit(0);
}

createTestProduct();