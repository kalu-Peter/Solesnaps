// Database migration to update products table for multiple colors and sizes
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5054,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'webwiz',
  database: process.env.DB_NAME || 'soledb',
};

async function updateProductsSchema() {
  const client = new Pool(dbConfig);
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Add new columns for colors and sizes as JSON arrays
    console.log('📋 Adding colors and sizes JSON columns...');
    
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS colors JSON DEFAULT '[]'::json,
      ADD COLUMN IF NOT EXISTS sizes JSON DEFAULT '[]'::json
    `);
    
    // Migrate existing color and size data to the new columns
    console.log('🔄 Migrating existing color and size data...');
    
    await client.query(`
      UPDATE products 
      SET 
        colors = CASE 
          WHEN color IS NOT NULL AND color != '' THEN json_build_array(color)
          ELSE '[]'::json
        END,
        sizes = CASE 
          WHEN size IS NOT NULL AND size != '' THEN json_build_array(size)
          ELSE '[]'::json
        END
      WHERE colors IS NULL OR sizes IS NULL
    `);
    
    console.log('✅ Schema updated successfully');
    
    // Show sample of updated data
    const sampleData = await client.query(`
      SELECT id, name, color, size, colors, sizes 
      FROM products 
      LIMIT 5
    `);
    
    console.log('📊 Sample updated data:');
    sampleData.rows.forEach(row => {
      console.log(`- ${row.name}: color="${row.color}" -> colors=${JSON.stringify(row.colors)}, size="${row.size}" -> sizes=${JSON.stringify(row.sizes)}`);
    });
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  updateProductsSchema();
}

module.exports = { updateProductsSchema };