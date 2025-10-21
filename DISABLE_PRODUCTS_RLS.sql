-- DISABLE RLS FOR PRODUCTS TABLE
-- This will allow product creation to work immediately

-- Step 1: Check current RLS status for products
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'products';

-- Step 2: Disable RLS for products table
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'products';

-- Optional: If you want to enable RLS later with proper policies, use:
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow authenticated users to manage products" ON public.products
--   FOR ALL TO authenticated USING (true) WITH CHECK (true);