// Database migration to add product_images table
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5054,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'webwiz',
  database: process.env.DB_NAME || 'soledb',
};

async function addProductImagesTable() {
  const client = new Pool(dbConfig);
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Create product_images table
    console.log('📋 Creating product_images table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255),
        is_primary BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true
    `);
    
    console.log('✅ product_images table created successfully');
    
    // Migrate existing image data from products.images to product_images table
    console.log('🔄 Migrating existing image data...');
    
    const existingProducts = await client.query(`
      SELECT id, images FROM products WHERE images IS NOT NULL AND array_length(images, 1) > 0
    `);
    
    for (const product of existingProducts.rows) {
      const images = product.images;
      for (let i = 0; i < images.length; i++) {
        await client.query(`
          INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [product.id, images[i], i === 0, i]);
      }
    }
    
    console.log(`✅ Migrated images for ${existingProducts.rows.length} products`);
    
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
  addProductImagesTable();
}

module.exports = { addProductImagesTable };