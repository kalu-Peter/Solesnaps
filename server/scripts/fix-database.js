// Database migration script to fix existing tables
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5054,
  database: process.env.DB_NAME || 'soledb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'webwiz',
};

async function fixDatabase() {
  const client = new Pool(dbConfig);
  
  try {
    console.log('🔧 Checking and fixing database structure...');
    
    // Drop existing tables to recreate them properly
    const dropQueries = [
      'DROP TABLE IF EXISTS reviews CASCADE',
      'DROP TABLE IF EXISTS order_items CASCADE',
      'DROP TABLE IF EXISTS orders CASCADE',
      'DROP TABLE IF EXISTS cart CASCADE',
      'DROP TABLE IF EXISTS products CASCADE',
      'DROP TABLE IF EXISTS categories CASCADE',
      'DROP TABLE IF EXISTS users CASCADE'
    ];
    
    for (const query of dropQueries) {
      await client.query(query);
    }
    
    console.log('🗑️ Old tables dropped');
    
    // Create fresh tables
    await createTables(client);
    console.log('✅ New tables created');
    
    // Insert initial data
    await insertInitialData(client);
    console.log('✅ Initial data inserted');
    
    console.log('🎉 Database fixed successfully!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
  } finally {
    await client.end();
  }
}

async function createTables(client) {
  const queries = [
    // Users table
    `CREATE TABLE users (
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
    `CREATE TABLE categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      image_url VARCHAR(500),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Products table
    `CREATE TABLE products (
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
      images TEXT[],
      is_featured BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Cart table
    `CREATE TABLE cart (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      size VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id, size)
    )`,
    
    // Orders table
    `CREATE TABLE orders (
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
    `CREATE TABLE order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      size VARCHAR(10),
      price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Reviews table
    `CREATE TABLE reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      product_id INTEGER REFERENCES products(id),
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    )`
  ];
  
  for (const query of queries) {
    await client.query(query);
  }
  
  // Create indexes
  const indexes = [
    'CREATE INDEX idx_products_category ON products(category_id)',
    'CREATE INDEX idx_products_active ON products(is_active)',
    'CREATE INDEX idx_cart_user ON cart(user_id)',
    'CREATE INDEX idx_orders_user ON orders(user_id)',
    'CREATE INDEX idx_orders_status ON orders(status)'
  ];
  
  for (const index of indexes) {
    await client.query(index);
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
      'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)',
      [category.name, category.slug, category.description]
    );
  }
  
  // Create admin user
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', 12);
  
  await client.query(
    'INSERT INTO users (email, password, first_name, last_name, role, is_verified) VALUES ($1, $2, $3, $4, $5, $6)',
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

// Run if called directly
if (require.main === module) {
  fixDatabase();
}

module.exports = { fixDatabase };