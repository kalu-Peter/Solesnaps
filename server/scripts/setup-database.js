// Database setup and initialization script
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5054,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'webwiz',
  database: 'postgres', // Connect to default database first
};

const targetDbName = process.env.DB_NAME || 'soledb';

async function setupDatabase() {
  let client;
  
  try {
    // Connect to PostgreSQL server
    console.log('🔗 Connecting to PostgreSQL...');
    client = new Pool(dbConfig);
    
    // Check if database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbExists = await client.query(checkDbQuery, [targetDbName]);
    
    if (dbExists.rows.length === 0) {
      // Create database
      console.log(`📦 Creating database: ${targetDbName}`);
      await client.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Database ${targetDbName} created successfully`);
    } else {
      console.log(`✅ Database ${targetDbName} already exists`);
    }
    
    await client.end();
    
    // Connect to the target database
    const targetClient = new Pool({
      ...dbConfig,
      database: targetDbName
    });
    
    try {
      // Create tables
      console.log('📋 Creating database tables...');
      await createTables(targetClient);
      
      // Insert initial data
      console.log('📝 Inserting initial data...');
      await insertInitialData(targetClient);
    } finally {
      await targetClient.end();
    }
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (client) await client.end();
    process.exit(1);
  }
}

async function createTables(client) {
  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      role VARCHAR(20) DEFAULT 'customer',
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Categories table
    `CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      image_url VARCHAR(500),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Products table
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      sale_price DECIMAL(10,2),
      sku VARCHAR(100) UNIQUE,
      stock_quantity INTEGER DEFAULT 0,
      category_id INTEGER REFERENCES categories(id),
      brand VARCHAR(100),
      size VARCHAR(10),
      color VARCHAR(50),
      material VARCHAR(100),
      images TEXT[], -- Array of image URLs
      is_featured BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Cart table
    `CREATE TABLE IF NOT EXISTS cart (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      size VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id, size)
    )`,
    
    // Orders table
    `CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      order_number VARCHAR(50) UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      total_amount DECIMAL(10,2) NOT NULL,
      shipping_address JSON NOT NULL,
      billing_address JSON NOT NULL,
      payment_method VARCHAR(50),
      payment_status VARCHAR(20) DEFAULT 'pending',
      tracking_number VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Order items table
    `CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      size VARCHAR(10),
      price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Reviews table
    `CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      product_id INTEGER REFERENCES products(id),
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    )`,
    
    // Indexes for better performance
    `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
  ];
  
  for (const query of queries) {
    await client.query(query);
  }
}

async function insertInitialData(client) {
  // Insert default categories
  const categories = [
    { name: 'Sneakers', slug: 'sneakers', description: 'Premium sneakers and casual shoes' },
    { name: 'Running Shoes', slug: 'running-shoes', description: 'Performance running shoes' },
    { name: 'Dress Shoes', slug: 'dress-shoes', description: 'Formal and business shoes' },
    { name: 'Boots', slug: 'boots', description: 'Boots for all occasions' },
    { name: 'Sandals', slug: 'sandals', description: 'Comfortable sandals and slides' }
  ];
  
  for (const category of categories) {
    await client.query(
      `INSERT INTO categories (name, slug, description) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (slug) DO NOTHING`,
      [category.name, category.slug, category.description]
    );
  }
  
  // Create admin user
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', 12);
  
  await client.query(
    `INSERT INTO users (email, password, first_name, last_name, role, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO NOTHING`,
    [
      process.env.ADMIN_EMAIL || 'admin@solesnaps.com',
      hashedPassword,
      'Admin',
      'User',
      'admin',
      true
    ]
  );
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };