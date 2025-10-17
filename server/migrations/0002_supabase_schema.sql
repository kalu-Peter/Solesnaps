-- Supabase Migration Script - Create All Tables for SoleDB
-- Generated: 2025-10-17
-- Database: Supabase PostgreSQL
-- Note: This migration drops existing tables and creates the complete schema structure optimized for Supabase

-- Start transaction to ensure all-or-nothing migration
BEGIN;

-- Drop existing tables in dependency order (if they exist)
-- This ensures a clean migration from integer-based to UUID-based schema
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.inventory_log CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.cart CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.delivery_locations CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Enable Row Level Security (RLS) - Supabase best practice
-- We'll create policies after table creation

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to Supabase auth
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer',
    is_verified BOOLEAN DEFAULT false,
    date_of_birth DATE,
    gender VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupons table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL CHECK (value > 0),
    min_order_amount NUMERIC DEFAULT 0 CHECK (min_order_amount >= 0),
    max_discount_amount NUMERIC CHECK (max_discount_amount > 0),
    usage_limit INTEGER CHECK (usage_limit > 0),
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_locations table
CREATE TABLE public.delivery_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name VARCHAR(100) UNIQUE NOT NULL,
    shopping_amount NUMERIC NOT NULL DEFAULT 0.00 CHECK (shopping_amount >= 0),
    pickup_location VARCHAR(255) NOT NULL,
    pickup_phone VARCHAR(20) NOT NULL,
    pickup_status VARCHAR(20) DEFAULT 'active' CHECK (pickup_status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    sale_price NUMERIC CHECK (sale_price >= 0),
    sku VARCHAR(100) UNIQUE,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    category_id UUID REFERENCES public.categories(id),
    brand VARCHAR(100),
    size VARCHAR(10), -- Legacy field
    color VARCHAR(50), -- Legacy field
    material VARCHAR(100),
    images TEXT[], -- Legacy array field
    colors JSONB DEFAULT '[]'::jsonb, -- Modern approach
    sizes JSONB DEFAULT '[]'::jsonb, -- Modern approach
    gender VARCHAR(10) DEFAULT 'unisex' CHECK (gender IN ('male', 'female', 'unisex')),
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_images table
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart table
CREATE TABLE public.cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    size VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id, size)
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    subtotal_amount NUMERIC CHECK (subtotal_amount >= 0),
    shipping_amount NUMERIC CHECK (shipping_amount >= 0),
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    tracking_number VARCHAR(100),
    notes TEXT,
    delivery_location_id UUID REFERENCES public.delivery_locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    size VARCHAR(10),
    price NUMERIC NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    product_id UUID REFERENCES public.products(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create inventory_log table
CREATE TABLE public.inventory_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id),
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('increase', 'decrease', 'adjustment')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL CHECK (previous_quantity >= 0),
    new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
    reason VARCHAR(255),
    reference_id UUID,
    reference_type VARCHAR(50),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wishlist table
CREATE TABLE public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_cart_user ON public.cart(user_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_featured ON public.products(is_featured);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_delivery_location ON public.orders(delivery_location_id);
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_images_primary ON public.product_images(product_id, is_primary) WHERE (is_primary = true);
CREATE INDEX idx_inventory_log_product_id ON public.inventory_log(product_id);
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active);

-- Create updated_at triggers for tables that need them
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_delivery_locations_updated_at BEFORE UPDATE ON public.delivery_locations FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- Categories: Public read access
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Products: Public read access for active products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);

-- Product Images: Public read access
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (true);

-- Cart: Users can manage their own cart
CREATE POLICY "Users can manage own cart" ON public.cart FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

-- Orders: Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

-- Order Items: Users can view their own order items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
    auth.uid() = (SELECT u.auth_id FROM public.users u JOIN public.orders o ON u.id = o.user_id WHERE o.id = order_id)
);

-- Reviews: Users can manage their own reviews, everyone can read
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews" ON public.reviews FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

-- Wishlist: Users can manage their own wishlist
CREATE POLICY "Users can manage own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

-- Coupons: Public read access for active coupons
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- Delivery Locations: Public read access for active locations
CREATE POLICY "Anyone can view active delivery locations" ON public.delivery_locations FOR SELECT USING (pickup_status = 'active');

-- Commit the transaction
COMMIT;

-- Summary
-- Tables created: 12 (UUID-based for Supabase compatibility)
-- - users: Integrated with Supabase auth
-- - categories: Product categories
-- - coupons: Discount coupons with validation
-- - delivery_locations: Shipping locations
-- - products: Product catalog with JSONB for modern data
-- - product_images: Image management
-- - cart: Shopping cart
-- - orders: Order management
-- - order_items: Order line items
-- - reviews: Product reviews
-- - inventory_log: Stock tracking
-- - wishlist: User favorites

-- Migration Notes:
-- ⚠️  EXISTING DATA WILL BE LOST - This is a destructive migration
-- ✅ UUID primary keys (Supabase standard)
-- ✅ Row Level Security (RLS) enabled
-- ✅ Comprehensive security policies
-- ✅ Automatic updated_at triggers
-- ✅ Data validation with CHECK constraints
-- ✅ Integration with Supabase auth system
-- ✅ JSONB for modern JSON handling
-- ✅ Performance indexes
-- ✅ Transaction-wrapped for safety

-- Post-Migration Steps:
-- 1. Run this migration in your Supabase SQL editor
-- 2. Restart your backend server
-- 3. Test user registration - should now use UUID format
-- 4. Re-create any essential data (categories, products, etc.)
-- 5. Update any hardcoded references to old numeric IDs