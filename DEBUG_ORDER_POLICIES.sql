-- DEBUG SCRIPT FOR ORDER CREATION ISSUES
-- Run this in Supabase SQL Editor to debug the 403 error

-- 1. Check if policies exist
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- 2. Check current auth user
SELECT auth.uid() as current_auth_uid;

-- 3. Check if user exists in users table with correct auth_id
SELECT id, first_name, last_name, email, auth_id, role
FROM public.users 
WHERE auth_id = auth.uid();

-- 4. Check RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'users');

-- 5. Test the policy condition manually
SELECT 
    auth.uid() as current_user,
    (SELECT auth_id FROM public.users WHERE id = auth.uid()) as user_auth_id,
    (SELECT id FROM public.users WHERE auth_id = auth.uid()) as user_id;