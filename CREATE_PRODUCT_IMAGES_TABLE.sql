-- CHECK AND CREATE PRODUCT_IMAGES TABLE
-- Run this in your Supabase SQL Editor

-- Step 1: Check if product_images table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_images' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to products table
  CONSTRAINT fk_product_images_product_id 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON public.product_images(is_primary);

-- Step 4: Disable RLS for product_images (to match other tables)
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;

-- Step 5: Verify table was created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_images' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 6: Check if any product_images records exist
SELECT COUNT(*) as total_images FROM public.product_images;