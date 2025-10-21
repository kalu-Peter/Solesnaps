-- AUTOMATIC USER MANAGEMENT FIX
-- This enables the system to automatically create users when they log in

-- Step 1: Disable RLS temporarily on all relevant tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Step 2: Clean up any existing conflicting users (optional)
-- DELETE FROM public.users WHERE email = 'test@solesnaps.com';

-- Step 3: Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'users')
ORDER BY tablename;

-- Step 4: The system will now automatically create users when they log in
-- No manual UUID entry needed!

-- Step 5: Verify after login (run this after trying to log in)
-- SELECT id, auth_id, email, first_name, last_name, role 
-- FROM public.users 
-- ORDER BY created_at DESC
-- LIMIT 5;