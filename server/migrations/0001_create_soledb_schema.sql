-- SoleDB Migration Script - Create All Tables
-- Generated: 2025-10-17
-- Database: PostgreSQL
-- Note: This migration creates the complete schema structure without data

-- Start transaction
BEGIN;

-- Drop existing tables in dependency order (if they exist)
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory_log CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS delivery_locations CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_of_birth DATE,
    gender VARCHAR(10)
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create coupons table
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'percentage',
    value NUMERIC NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    max_discount_amount NUMERIC,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create delivery_locations table
CREATE TABLE delivery_locations (
    id SERIAL PRIMARY KEY,
    city_name VARCHAR(100) UNIQUE NOT NULL,
    shopping_amount NUMERIC NOT NULL DEFAULT 0.00,
    pickup_location VARCHAR(255) NOT NULL,
    pickup_phone VARCHAR(20) NOT NULL,
    pickup_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    sale_price NUMERIC,
    sku VARCHAR(100) UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    category_id INTEGER REFERENCES categories(id),
    brand VARCHAR(100),
    size VARCHAR(10),
    color VARCHAR(50),
    material VARCHAR(100),
    images TEXT[], -- Array of image URLs (legacy)
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    colors JSON DEFAULT '[]'::json,
    sizes JSON DEFAULT '[]'::json,
    gender VARCHAR(10) DEFAULT 'unisex'
);

-- Create product_images table
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create cart table
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    size VARCHAR(10),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, size)
);

-- Create orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount NUMERIC NOT NULL,
    shipping_address JSON NOT NULL,
    billing_address JSON NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivery_location_id INTEGER REFERENCES delivery_locations(id),
    subtotal_amount NUMERIC,
    shipping_amount NUMERIC
);

-- Create order_items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    size VARCHAR(10),
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Create inventory_log table
CREATE TABLE inventory_log (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    change_type VARCHAR(20) NOT NULL,
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason VARCHAR(255),
    reference_id INTEGER,
    reference_type VARCHAR(50),
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create wishlist table
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_location ON orders(delivery_location_id);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE (is_primary = true);
CREATE INDEX idx_inventory_log_product_id ON inventory_log(product_id);
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);

-- Commit transaction
COMMIT;

-- Summary
-- Tables created: 12
-- - users: User accounts and profiles
-- - categories: Product categories
-- - coupons: Discount coupons and promotions
-- - delivery_locations: Shipping and pickup locations
-- - products: Product catalog with variants
-- - product_images: Product image management
-- - cart: Shopping cart items
-- - orders: Order records
-- - order_items: Individual order line items
-- - reviews: Product reviews and ratings
-- - inventory_log: Stock movement tracking
-- - wishlist: User favorite products

-- Notes:
-- 1. All foreign key relationships are preserved
-- 2. Indexes are created for optimal query performance
-- 3. Data types match the existing database exactly
-- 4. This migration does NOT include data - schema only
-- 5. Transaction ensures atomic operation (all or nothing)

-- To apply this migration:
-- psql -h localhost -p 5054 -U postgres -d soledb -f 0001_create_soledb_schema.sql