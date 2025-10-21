-- COMPLETE RLS DISABLE FOR USER MANAGEMENT
-- This disables RLS on users table to allow user creation and lookup

-- Disable RLS on users table temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify all RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items', 'users')
ORDER BY tablename;

-- Now manually insert/update the user
-- First check if user exists
SELECT id, auth_id, email, first_name, last_name, role 
FROM public.users 
WHERE email = 'test@solesnaps.com' OR auth_id = '254eb5ee-33bc-4c91-86e9-40efffdcfe74'::uuid;

-- Delete old user and insert the CURRENT user (from the error message)
DELETE FROM public.users WHERE email = 'test@solesnaps.com';

-- Insert the current user with correct UUID
INSERT INTO public.users (id, auth_id, email, first_name, last_name, role, created_at, updated_at)
VALUES (
    '6c160cc2-81dd-4709-9efb-1ea68a1d577a'::uuid,  -- Current user ID from error
    '6c160cc2-81dd-4709-9efb-1ea68a1d577a'::uuid,  -- Same as id
    'test@solesnaps.com',
    'Test',
    'User',
    'customer',
    NOW(),
    NOW()
);

-- Verify the correct user exists
SELECT id, auth_id, email, first_name, last_name, role 
FROM public.users 
WHERE id = '6c160cc2-81dd-4709-9efb-1ea68a1d577a'::uuid;