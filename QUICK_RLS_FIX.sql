-- QUICK RLS FIX - MORE PERMISSIVE POLICIES
-- Drop all existing policies and create simpler ones

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read for own orders" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable read for own order items" ON public.order_items;

-- Create more permissive policies for orders
CREATE POLICY "Allow authenticated users to insert orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow users to read their orders" ON public.orders
  FOR SELECT TO authenticated USING (true);

-- Create more permissive policies for order_items  
CREATE POLICY "Allow authenticated users to insert order items" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow users to read order items" ON public.order_items
  FOR SELECT TO authenticated USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;