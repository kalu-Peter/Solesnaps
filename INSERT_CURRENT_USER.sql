-- QUICK FIX: Handle user ID mismatch between Supabase Auth and database
-- This fixes the foreign key constraint issue for existing users

-- First, let's see the current authenticated user and existing database user
SELECT auth.uid() as current_auth_user_id, auth.email() as current_auth_email;

-- Check existing user in database
SELECT id, auth_id, email, first_name, last_name, role 
FROM public.users 
WHERE email = 'test@solesnaps.com';

-- OPTION 1: Update existing user's auth_id to match Supabase Auth
UPDATE public.users 
SET auth_id = '254eb5ee-33bc-4c91-86e9-40efffdcfe74'::uuid,
    updated_at = NOW()
WHERE email = 'test@solesnaps.com';

-- OPTION 2: If that doesn't work, create new user with different email
-- Uncomment and modify if needed:
-- INSERT INTO public.users (id, auth_id, email, first_name, last_name, role, created_at, updated_at)
-- VALUES (
--     '254eb5ee-33bc-4c91-86e9-40efffdcfe74'::uuid,
--     '254eb5ee-33bc-4c91-86e9-40efffdcfe74'::uuid,
--     'test-new@solesnaps.com',  -- Different email to avoid conflict
--     'Test',
--     'User',
--     'customer',
--     NOW(),
--     NOW()
-- );

-- Verify the fix
SELECT id, auth_id, email, first_name, last_name, role 
FROM public.users 
WHERE auth_id = '254eb5ee-33bc-4c91-86e9-40efffdcfe74';