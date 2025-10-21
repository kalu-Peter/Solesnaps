-- CREATE SUPABASE STORAGE BUCKET FOR PRODUCT IMAGES
-- Run this in your Supabase SQL Editor

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,  -- Make bucket public so images can be accessed via URL
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'] -- Allowed image types
)
ON CONFLICT (id) DO NOTHING; -- Don't error if bucket already exists

-- Step 2: Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policy for authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
  );

-- Step 4: Create policy for public read access to images  
CREATE POLICY "Allow public read access to product images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');

-- Step 5: Create policy for authenticated users to update their uploads
CREATE POLICY "Allow authenticated users to update product images" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
  ) WITH CHECK (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
  );

-- Step 6: Create policy for authenticated users to delete their uploads
CREATE POLICY "Allow authenticated users to delete product images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
  );

-- Step 7: Verify bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images';

-- Step 8: Verify policies were created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';