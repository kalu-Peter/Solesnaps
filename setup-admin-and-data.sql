-- Complete Admin Setup and Sample Data
-- Run this in your Supabase SQL editor

-- Step 1: First make the current authenticated user an admin
-- Replace 'your-email@example.com' with your actual email
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- If no user exists, create an admin user (update the email and auth_id)
-- You can get your auth_id from the Supabase Auth dashboard
INSERT INTO public.users (auth_id, email, first_name, last_name, role)
VALUES (
  -- Replace this with your actual auth.users.id from Supabase Auth
  'your-auth-id-here',
  'your-email@example.com',
  'Admin',
  'User',
  'admin'
) ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Step 2: Create some sample customer users
INSERT INTO public.users (email, first_name, last_name, role, phone) VALUES
  ('john.doe@example.com', 'John', 'Doe', 'customer', '+254700123456'),
  ('jane.smith@example.com', 'Jane', 'Smith', 'customer', '+254700987654'),
  ('mike.johnson@example.com', 'Mike', 'Johnson', 'customer', '+254700555111')
ON CONFLICT (email) DO NOTHING;

-- Step 3: Create sample categories
INSERT INTO public.categories (name, slug, description, is_active) VALUES
  ('Sneakers', 'sneakers', 'Athletic and casual sneakers', true),
  ('Boots', 'boots', 'Formal and casual boots', true),
  ('Sandals', 'sandals', 'Summer sandals and flip-flops', true)
ON CONFLICT (slug) DO NOTHING;

-- Step 4: Create sample products
INSERT INTO public.products (name, slug, description, price, stock_quantity, category_id, brand, is_active, is_featured) 
SELECT 
  'Nike Air Max 90',
  'nike-air-max-90',
  'Classic Nike Air Max sneakers with air cushioning',
  12500.00,
  50,
  c.id,
  'Nike',
  true,
  true
FROM public.categories c WHERE c.slug = 'sneakers'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, price, stock_quantity, category_id, brand, is_active, is_featured) 
SELECT 
  'Adidas Ultraboost 22',
  'adidas-ultraboost-22',
  'Premium running shoes with Boost technology',
  18999.00,
  30,
  c.id,
  'Adidas',
  true,
  true
FROM public.categories c WHERE c.slug = 'sneakers'
ON CONFLICT (slug) DO NOTHING;

-- Step 5: Create sample delivery locations
INSERT INTO public.delivery_locations (city_name, shopping_amount, pickup_location, pickup_phone) VALUES
  ('Nairobi', 0.00, 'CBD Pick-up Point', '+254700000001'),
  ('Mombasa', 1000.00, 'Town Center', '+254700000002'),
  ('Kisumu', 1500.00, 'Main Market', '+254700000003')
ON CONFLICT (city_name) DO NOTHING;

-- Step 6: Create sample orders with proper relationships
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  product1_id UUID;
  product2_id UUID;
  delivery1_id UUID;
  delivery2_id UUID;
  order1_id UUID;
  order2_id UUID;
  order3_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO user1_id FROM public.users WHERE email = 'john.doe@example.com';
  SELECT id INTO user2_id FROM public.users WHERE email = 'jane.smith@example.com';
  SELECT id INTO user3_id FROM public.users WHERE email = 'mike.johnson@example.com';
  
  -- Get product IDs
  SELECT id INTO product1_id FROM public.products WHERE slug = 'nike-air-max-90';
  SELECT id INTO product2_id FROM public.products WHERE slug = 'adidas-ultraboost-22';
  
  -- Get delivery location IDs
  SELECT id INTO delivery1_id FROM public.delivery_locations WHERE city_name = 'Nairobi';
  SELECT id INTO delivery2_id FROM public.delivery_locations WHERE city_name = 'Mombasa';
  
  -- Create orders only if we have the required data
  IF user1_id IS NOT NULL AND product1_id IS NOT NULL AND delivery1_id IS NOT NULL THEN
    -- Order 1: John's pending order
    INSERT INTO public.orders (
      user_id, order_number, status, total_amount, subtotal_amount, shipping_amount,
      shipping_address, billing_address, payment_method, payment_status, delivery_location_id
    ) VALUES (
      user1_id,
      'ORDER-' || extract(epoch from now())::text || '-001',
      'pending',
      12500.00,
      12500.00,
      0.00,
      jsonb_build_object(
        'city', 'Nairobi',
        'pickup_location', 'CBD Pick-up Point',
        'phone', '+254700123456'
      ),
      jsonb_build_object(
        'city', 'Nairobi',
        'pickup_location', 'CBD Pick-up Point',
        'phone', '+254700123456'
      ),
      'mpesa',
      'pending',
      delivery1_id
    ) RETURNING id INTO order1_id;
    
    -- Add order items for order 1
    INSERT INTO public.order_items (order_id, product_id, quantity, price) VALUES
      (order1_id, product1_id, 1, 12500.00);
  END IF;
  
  IF user2_id IS NOT NULL AND product2_id IS NOT NULL AND delivery2_id IS NOT NULL THEN
    -- Order 2: Jane's processing order
    INSERT INTO public.orders (
      user_id, order_number, status, total_amount, subtotal_amount, shipping_amount,
      shipping_address, billing_address, payment_method, payment_status, delivery_location_id,
      tracking_number
    ) VALUES (
      user2_id,
      'ORDER-' || extract(epoch from now())::text || '-002',
      'processing',
      19999.00,
      18999.00,
      1000.00,
      jsonb_build_object(
        'city', 'Mombasa',
        'pickup_location', 'Town Center',
        'phone', '+254700987654'
      ),
      jsonb_build_object(
        'city', 'Mombasa',
        'pickup_location', 'Town Center',
        'phone', '+254700987654'
      ),
      'card',
      'paid',
      delivery2_id,
      'TRK123456789'
    ) RETURNING id INTO order2_id;
    
    -- Add order items for order 2
    INSERT INTO public.order_items (order_id, product_id, quantity, price) VALUES
      (order2_id, product2_id, 1, 18999.00);
  END IF;
  
  IF user3_id IS NOT NULL AND product1_id IS NOT NULL AND delivery1_id IS NOT NULL THEN
    -- Order 3: Mike's completed order
    INSERT INTO public.orders (
      user_id, order_number, status, total_amount, subtotal_amount, shipping_amount,
      shipping_address, billing_address, payment_method, payment_status, delivery_location_id,
      tracking_number
    ) VALUES (
      user3_id,
      'ORDER-' || extract(epoch from now())::text || '-003',
      'completed',
      12500.00,
      12500.00,
      0.00,
      jsonb_build_object(
        'city', 'Nairobi',
        'pickup_location', 'CBD Pick-up Point',
        'phone', '+254700555111'
      ),
      jsonb_build_object(
        'city', 'Nairobi',
        'pickup_location', 'CBD Pick-up Point',
        'phone', '+254700555111'
      ),
      'mpesa',
      'paid',
      delivery1_id,
      'TRK987654321'
    ) RETURNING id INTO order3_id;
    
    -- Add order items for order 3
    INSERT INTO public.order_items (order_id, product_id, quantity, price) VALUES
      (order3_id, product1_id, 1, 12500.00);
  END IF;
  
  RAISE NOTICE 'Sample data created successfully!';
  RAISE NOTICE 'Users created: %, %, %', user1_id, user2_id, user3_id;
  RAISE NOTICE 'Orders created: %, %, %', order1_id, order2_id, order3_id;
END $$;