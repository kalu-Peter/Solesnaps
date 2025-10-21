-- SIMPLE RLS POLICY FIX
-- Since users already exist in public.users, we just need proper RLS policies

-- Step 1: Check current users
SELECT id, auth_id, email, first_name, last_name, role 
FROM public.users 
ORDER BY created_at DESC;

-- Step 2: Check what auth.uid() returns for current user
SELECT auth.uid() as current_auth_uid, auth.email() as current_email;

-- Step 3: Re-enable RLS (if disabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read for own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;
DROP POLICY IF EXISTS "Enable read for own order items" ON public.order_items;

-- Step 5: Create working RLS policies
-- Users table policies
CREATE POLICY "Enable read access for authenticated users" ON public.users
  FOR SELECT USING (auth.uid() = auth_id::uuid);

CREATE POLICY "Enable update for own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id::uuid);

-- Orders table policies  
CREATE POLICY "Enable insert for authenticated users" ON public.orders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable read for own orders" ON public.orders
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Order items table policies
CREATE POLICY "Enable insert for order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id 
      AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Enable read for own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id 
      AND user_id::text = auth.uid()::text
    )
  );

-- Step 6: Verify policies are created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('users', 'orders', 'order_items')
ORDER BY tablename, policyname;

-- Step 7: Test if current user can be found
SELECT id, auth_id, email, first_name, last_name 
FROM public.users 
WHERE auth_id = auth.uid();

-- Step 8: Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'users')
ORDER BY tablename;