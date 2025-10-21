-- SIMPLE BUCKET CREATION ONLY
-- Just create the bucket, let Dashboard handle policies

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,  -- Make bucket public so images can be accessed via URL
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'] -- Allowed image types
)
ON CONFLICT (id) DO NOTHING; -- Don't error if bucket already exists

-- Verify bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images';