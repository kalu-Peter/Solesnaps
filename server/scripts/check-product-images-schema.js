const { query } = require('../src/config/database');

async function checkProductImagesSchema() {
  try {
    console.log('Checking product_images table schema...');
    const result = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'product_images' 
      ORDER BY ordinal_position
    `);
    
    console.log('Product_images table columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\nChecking if product_images have any data...');
    const countResult = await query('SELECT COUNT(*) as count FROM product_images');
    console.log(`Total product images: ${countResult.rows[0].count}`);
    
    if (countResult.rows[0].count > 0) {
      console.log('\nSample product image data:');
      const sampleResult = await query('SELECT * FROM product_images LIMIT 1');
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error checking product_images schema:', error);
  }
  process.exit(0);
}

checkProductImagesSchema();