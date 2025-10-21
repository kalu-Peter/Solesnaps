-- MANUAL SUPABASE POLICY FIX (UPDATED)
-- Copy and paste this SQL into your Supabase SQL Editor to fix the 403 error

-- First, drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items for own orders" ON public.order_items;

-- Method 1: Try with direct auth.uid() comparison (if user_id is the auth UUID)
CREATE POLICY "Users can create own orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Method 2: If that doesn't work, try this alternative (if users table has auth_id)
-- CREATE POLICY "Users can create own orders" 
-- ON public.orders FOR INSERT 
-- WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

-- For order_items - simplified approach
CREATE POLICY "Users can create order items for own orders" 
ON public.order_items FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE id = order_id 
        AND user_id::text = auth.uid()::text
    )
);

-- 3. Verify policies were created
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- 4. Check what auth.uid() returns
SELECT auth.uid() as current_auth_user;

-- 5. Check users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;