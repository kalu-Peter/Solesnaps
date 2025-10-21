-- DEBUG RLS POLICY ISSUE
-- Let's see exactly what's happening with the user IDs

-- Step 1: Check what auth.uid() returns
SELECT auth.uid() as current_auth_uid, auth.email() as current_email;

-- Step 2: Check current users in public.users
SELECT id, auth_id, email, first_name, last_name, role 
FROM public.users 
ORDER BY created_at DESC;

-- Step 3: Check if auth.uid() matches any auth_id in users table
SELECT 
  auth.uid() as auth_uid,
  u.id as user_id,
  u.auth_id,
  u.email,
  (auth.uid() = u.auth_id::uuid) as ids_match,
  (auth.uid()::text = u.id::text) as auth_equals_user_id
FROM public.users u
WHERE u.auth_id = auth.uid();

-- Step 4: Temporarily disable RLS to test if that's the issue
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Step 5: Show current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'users')
ORDER BY tablename;

-- NOTE: After testing, you may want to re-enable RLS:
-- ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;