-- Add INSERT policies for orders and order_items tables
-- This allows authenticated users to create orders and order items

-- Allow authenticated users to insert their own orders
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

-- Allow authenticated users to insert order items for their own orders
CREATE POLICY "Users can create order items for own orders" ON public.order_items FOR INSERT 
WITH CHECK (
    auth.uid() = (SELECT u.auth_id FROM public.users u JOIN public.orders o ON u.id = o.user_id WHERE o.id = order_id)
);