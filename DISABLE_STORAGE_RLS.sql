-- DISABLE RLS FOR STORAGE TO ALLOW IMAGE UPLOADS
-- Run this in your Supabase SQL Editor

-- Step 1: Check current RLS status for storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Step 2: Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Step 4: Verify your bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images';

-- Note: This disables RLS completely for storage objects
-- For production, you may want proper RLS policies instead