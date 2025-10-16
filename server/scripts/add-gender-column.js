const { query } = require('../src/config/database');

async function addGenderColumn() {
  try {
    console.log('🔄 Adding gender column to products table...');
    
    // Add gender column to products table
    await query(`
      ALTER TABLE products 
      ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'unisex')) DEFAULT 'unisex'
    `);
    
    console.log('✅ Gender column added successfully!');
    
    // Update existing products to have default gender values based on category or brand
    console.log('🔄 Setting default gender values for existing products...');
    
    // Set some intelligent defaults based on product names/brands
    await query(`
      UPDATE products 
      SET gender = CASE 
        WHEN LOWER(name) LIKE '%women%' OR LOWER(name) LIKE '%ladies%' OR LOWER(name) LIKE '%female%' THEN 'female'
        WHEN LOWER(name) LIKE '%men%' OR LOWER(name) LIKE '%mens%' OR LOWER(name) LIKE '%male%' THEN 'male'
        ELSE 'unisex'
      END
    `);
    
    console.log('✅ Default gender values set for existing products!');
    
    // Show updated products
    const result = await query('SELECT id, name, gender FROM products ORDER BY id');
    console.log('\n📋 Updated products:');
    result.rows.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id}) -> ${product.gender}`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error adding gender column:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  addGenderColumn()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addGenderColumn;