-- Fix for Infinite Recursion in RLS Policies
-- Run this in your Supabase SQL editor

-- Step 1: Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

-- Step 2: Create a function to check if current user is admin (avoiding recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user's email is in our admin list or if they have admin role in JWT
  RETURN (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data ->> 'role' = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Alternative approach - use a simpler admin check
-- Create policies that use service role or specific admin user IDs
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- First try to get role from JWT
  user_role := auth.jwt() ->> 'user_metadata' ->> 'role';
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback: check specific admin user IDs (replace with your actual admin user ID)
  -- You can find your user ID in Supabase Auth dashboard
  RETURN auth.uid() IN (
    -- Add your admin user IDs here (get from Supabase Auth dashboard)
    -- 'your-admin-user-id-1',
    -- 'your-admin-user-id-2'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create new admin policies using the safe function
-- Admin policies for users table
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can update all users" ON public.users
FOR UPDATE USING (is_admin_user());

-- Admin policies for orders table
CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can update all orders" ON public.orders
FOR UPDATE USING (is_admin_user());

-- Admin policies for order_items table
CREATE POLICY "Admins can view all order items" ON public.order_items
FOR SELECT USING (is_admin_user());

-- Admin policies for products table
CREATE POLICY "Admins can manage all products" ON public.products
FOR ALL USING (is_admin_user());

-- Admin policies for categories table
CREATE POLICY "Admins can manage all categories" ON public.categories
FOR ALL USING (is_admin_user());

-- Step 5: Temporary fix - if still having issues, disable RLS for testing
-- Uncomment these lines ONLY for testing (not recommended for production)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;