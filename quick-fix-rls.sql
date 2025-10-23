-- Quick Fix: Disable RLS for Admin Testing
-- This is a temporary solution to get your admin panel working
-- Run this in your Supabase SQL editor

-- OPTION 1: Completely disable RLS for these tables (TEMPORARY - for testing only)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- OPTION 2: If you want to keep some security, create a simple bypass
-- Uncomment the lines below instead of using OPTION 1

-- -- Drop existing problematic policies
-- DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
-- DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

-- -- Create permissive policies for testing
-- CREATE POLICY "Allow all for authenticated users" ON public.users FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all for authenticated orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all for authenticated order items" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');

-- After running this, your admin panel should work immediately
-- Remember to re-enable proper RLS policies for production!