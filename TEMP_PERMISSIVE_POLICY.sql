-- TEMPORARY PERMISSIVE POLICY FOR TESTING
-- This allows ANY authenticated user to create orders (for debugging only)
-- REMOVE THIS AFTER FIXING THE MAIN ISSUE

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items for own orders" ON public.order_items;

-- Create temporary permissive policies
CREATE POLICY "temp_allow_all_orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "temp_allow_all_order_items" 
ON public.order_items FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Test queries
SELECT auth.uid() as current_user;
SELECT auth.role() as current_role;

-- Check if we can see the users table
SELECT count(*) as user_count FROM public.users;