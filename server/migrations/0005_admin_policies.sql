-- Admin Policies for SoleDB
-- Add policies to allow admin users to manage all data

-- First, let's add admin policies for users table
-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON public.users 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admin policies for orders table
-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update all orders
CREATE POLICY "Admins can update all orders" ON public.orders 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admin policies for order_items table
-- Admins can view all order items
CREATE POLICY "Admins can view all order items" ON public.order_items 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admin policies for products table
-- Admins can manage all products
CREATE POLICY "Admins can manage all products" ON public.products 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admin policies for categories table
-- Admins can manage all categories
CREATE POLICY "Admins can manage all categories" ON public.categories 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admin policies for coupons table
-- Admins can manage all coupons
CREATE POLICY "Admins can manage all coupons" ON public.coupons 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admin policies for delivery_locations table
-- Admins can manage all delivery locations
CREATE POLICY "Admins can manage all delivery locations" ON public.delivery_locations 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admin policies for reviews table
-- Admins can view and moderate all reviews
CREATE POLICY "Admins can manage all reviews" ON public.reviews 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admin policies for inventory_log table
-- Admins can view all inventory logs
CREATE POLICY "Admins can view all inventory logs" ON public.inventory_log 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can create inventory logs
CREATE POLICY "Admins can create inventory logs" ON public.inventory_log 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);