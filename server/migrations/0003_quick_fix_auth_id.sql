-- Quick fix: Add auth_id column to existing users table
-- Run this in your Supabase SQL Editor to make the current setup work

-- Add the auth_id column to link with Supabase auth
ALTER TABLE public.users 
ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_users_auth_id ON public.users(auth_id);

-- This allows the current Supabase integration to work with your existing table structure