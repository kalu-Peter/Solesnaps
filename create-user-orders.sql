-- Create Sample Orders for User Testing
-- Run this in your Supabase SQL editor after updating your email

-- Step 1: Update your user to be admin (replace with your actual email)
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Step 2: Create sample categories and products if they don't exist
INSERT INTO public.categories (name, slug, description, is_active) VALUES
  ('Sneakers', 'sneakers', 'Athletic and casual sneakers', true),
  ('Boots', 'boots', 'Formal and casual boots', true),
  ('Sandals', 'sandals', 'Summer sandals and flip-flops', true)
ON CONFLICT (slug) DO NOTHING;

-- Create sample products
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

INSERT INTO public.products (name, slug, description, price, stock_quantity, category_id, brand, is_active, is_featured) 
SELECT 
  'Puma RS-X',
  'puma-rs-x',
  'Retro-inspired lifestyle sneakers',
  9999.00,
  25,
  c.id,
  'Puma',
  true,
  false
FROM public.categories c WHERE c.slug = 'sneakers'
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Create delivery locations
INSERT INTO public.delivery_locations (city_name, shopping_amount, pickup_location, pickup_phone) VALUES
  ('Nairobi', 0.00, 'CBD Pick-up Point', '+254700000001'),
  ('Mombasa', 1000.00, 'Town Center', '+254700000002'),
  ('Kisumu', 1500.00, 'Main Market', '+254700000003')
ON CONFLICT (city_name) DO NOTHING;

-- Step 4: Create sample orders for the current user
-- Replace 'your-email@example.com' with your actual email address
DO $$
DECLARE
  current_user_id UUID;
  admin_user_id UUID;
  product1_id UUID;
  product2_id UUID;
  product3_id UUID;
  delivery1_id UUID;
  delivery2_id UUID;
  order1_id UUID;
  order2_id UUID;
  order3_id UUID;
  order4_id UUID;
BEGIN
  -- Get the current user ID (replace with your email)
  SELECT id INTO current_user_id FROM public.users WHERE email = 'your-email@example.com';
  
  -- If user doesn't exist, create them (replace email and add your auth_id)
  IF current_user_id IS NULL THEN
    INSERT INTO public.users (email, first_name, last_name, role, phone, auth_id)
    VALUES (
      'your-email@example.com',  -- Replace with your email
      'Your',                    -- Replace with your first name
      'Name',                    -- Replace with your last name
      'admin',
      '+254700123456',
      'your-auth-id-from-supabase'  -- Get this from Supabase Auth dashboard
    ) RETURNING id INTO current_user_id;
  END IF;
  
  -- Create a second test user for comparison
  INSERT INTO public.users (email, first_name, last_name, role, phone) VALUES
    ('testuser@example.com', 'Test', 'User', 'customer', '+254700987654')
  ON CONFLICT (email) DO NOTHING;
  
  SELECT id INTO admin_user_id FROM public.users WHERE email = 'testuser@example.com';
  
  -- Get product IDs
  SELECT id INTO product1_id FROM public.products WHERE slug = 'nike-air-max-90';
  SELECT id INTO product2_id FROM public.products WHERE slug = 'adidas-ultraboost-22';
  SELECT id INTO product3_id FROM public.products WHERE slug = 'puma-rs-x';
  
  -- Get delivery location IDs
  SELECT id INTO delivery1_id FROM public.delivery_locations WHERE city_name = 'Nairobi';
  SELECT id INTO delivery2_id FROM public.delivery_locations WHERE city_name = 'Mombasa';
  
  -- Create orders for the current user
  IF current_user_id IS NOT NULL AND product1_id IS NOT NULL AND delivery1_id IS NOT NULL THEN
    -- Order 1: Recent pending order
    INSERT INTO public.orders (
      user_id, order_number, status, total_amount, subtotal_amount, shipping_amount,
      shipping_address, billing_address, payment_method, payment_status, delivery_location_id
    ) VALUES (
      current_user_id,
      'ORDER-' || extract(epoch from now())::text || '-USER1',
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
    INSERT INTO public.order_items (order_id, product_id, quantity, price, size) VALUES
      (order1_id, product1_id, 1, 12500.00, '42');
  END IF;
  
  IF current_user_id IS NOT NULL AND product2_id IS NOT NULL AND delivery2_id IS NOT NULL THEN
    -- Order 2: Processing order with tracking
    INSERT INTO public.orders (
      user_id, order_number, status, total_amount, subtotal_amount, shipping_amount,
      shipping_address, billing_address, payment_method, payment_status, delivery_location_id,
      tracking_number
    ) VALUES (
      current_user_id,
      'ORDER-' || extract(epoch from now())::text || '-USER2',
      'processing',
      19999.00,
      18999.00,
      1000.00,
      jsonb_build_object(
        'city', 'Mombasa',
        'pickup_location', 'Town Center',
        'phone', '+254700123456'
      ),
      jsonb_build_object(
        'city', 'Mombasa',
        'pickup_location', 'Town Center',
        'phone', '+254700123456'
      ),
      'card',
      'paid',
      delivery2_id,
      'TRK123456789'
    ) RETURNING id INTO order2_id;
    
    -- Add order items for order 2
    INSERT INTO public.order_items (order_id, product_id, quantity, price, size) VALUES
      (order2_id, product2_id, 1, 18999.00, '43');
  END IF;
  
  IF current_user_id IS NOT NULL AND product3_id IS NOT NULL AND delivery1_id IS NOT NULL THEN
    -- Order 3: Delivered order
    INSERT INTO public.orders (
      user_id, order_number, status, total_amount, subtotal_amount, shipping_amount,
      shipping_address, billing_address, payment_method, payment_status, delivery_location_id,
      tracking_number, created_at
    ) VALUES (
      current_user_id,
      'ORDER-' || extract(epoch from now())::text || '-USER3',
      'delivered',
      9999.00,
      9999.00,
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
      'paid',
      delivery1_id,
      'TRK987654321',
      NOW() - INTERVAL '7 days'  -- Order from a week ago
    ) RETURNING id INTO order3_id;
    
    -- Add order items for order 3
    INSERT INTO public.order_items (order_id, product_id, quantity, price, size) VALUES
      (order3_id, product3_id, 1, 9999.00, '41');
  END IF;
  
  -- Order 4: Multiple items order
  IF current_user_id IS NOT NULL AND product1_id IS NOT NULL AND product2_id IS NOT NULL AND delivery1_id IS NOT NULL THEN
    INSERT INTO public.orders (
      user_id, order_number, status, total_amount, subtotal_amount, shipping_amount,
      shipping_address, billing_address, payment_method, payment_status, delivery_location_id,
      created_at
    ) VALUES (
      current_user_id,
      'ORDER-' || extract(epoch from now())::text || '-USER4',
      'shipped',
      31499.00,
      31499.00,
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
      'card',
      'paid',
      delivery1_id,
      NOW() - INTERVAL '3 days'  -- Order from 3 days ago
    ) RETURNING id INTO order4_id;
    
    -- Add multiple order items for order 4
    INSERT INTO public.order_items (order_id, product_id, quantity, price, size) VALUES
      (order4_id, product1_id, 1, 12500.00, '42'),
      (order4_id, product2_id, 1, 18999.00, '43');
  END IF;
  
  -- Create an order for the test user (to verify filtering works)
  IF admin_user_id IS NOT NULL AND product1_id IS NOT NULL AND delivery1_id IS NOT NULL THEN
    INSERT INTO public.orders (
      user_id, order_number, status, total_amount, subtotal_amount, shipping_amount,
      shipping_address, billing_address, payment_method, payment_status, delivery_location_id
    ) VALUES (
      admin_user_id,
      'ORDER-' || extract(epoch from now())::text || '-TEST',
      'confirmed',
      12500.00,
      12500.00,
      0.00,
      jsonb_build_object(
        'city', 'Nairobi',
        'pickup_location', 'CBD Pick-up Point',
        'phone', '+254700987654'
      ),
      jsonb_build_object(
        'city', 'Nairobi',
        'pickup_location', 'CBD Pick-up Point',
        'phone', '+254700987654'
      ),
      'mpesa',
      'pending',
      delivery1_id
    );
    
    -- Add order item for test user order
    INSERT INTO public.order_items (order_id, product_id, quantity, price, size) VALUES
      (currval('orders_id_seq'), product1_id, 1, 12500.00, '44');
  END IF;
  
  RAISE NOTICE 'Sample orders created successfully!';
  RAISE NOTICE 'Current user ID: %', current_user_id;
  RAISE NOTICE 'Orders created: %, %, %, %', order1_id, order2_id, order3_id, order4_id;
END $$;