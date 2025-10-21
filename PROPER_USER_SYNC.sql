-- PROPER SOLUTION: Auto-sync users from auth to public schema
-- This creates users in public.users automatically when they sign up

-- Step 1: Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, auth_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger to run this function when users sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Re-enable RLS with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Step 4: Create proper RLS policies
-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Users can create orders for themselves
CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can create order items for their own orders
CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id 
      AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id 
      AND user_id::text = auth.uid()::text
    )
  );

-- Step 5: Handle existing users (backfill)
INSERT INTO public.users (id, auth_id, email, first_name, last_name, role)
SELECT 
  id,
  id as auth_id,
  email,
  COALESCE(raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(raw_user_meta_data->>'last_name', '') as last_name,
  COALESCE(raw_user_meta_data->>'role', 'customer') as role
FROM auth.users
WHERE id NOT IN (SELECT auth_id FROM public.users WHERE auth_id IS NOT NULL);

-- Verify everything is working
SELECT 'Auth users:' as table_name, count(*) as count FROM auth.users
UNION ALL
SELECT 'Public users:', count(*) FROM public.users;

SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'users')
ORDER BY tablename;