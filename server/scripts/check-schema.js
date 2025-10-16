const { query } = require('../src/config/database');

async function checkSchema() {
  try {
    console.log('Checking products table schema...');
    const result = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    console.log('Products table columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\nChecking if products have any data...');
    const countResult = await query('SELECT COUNT(*) as count FROM products');
    console.log(`Total products: ${countResult.rows[0].count}`);
    
    if (countResult.rows[0].count > 0) {
      console.log('\nSample product data:');
      const sampleResult = await query('SELECT * FROM products LIMIT 1');
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
  process.exit(0);
}

checkSchema();