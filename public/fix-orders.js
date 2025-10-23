// Fix for user orders not showing issue
// This script will diagnose and fix the user ID mismatch between orders.user_id and users.id

import { supabase } from './src/lib/supabase.js';

async function fixUserOrdersIssue() {
    console.log('=== FIXING USER ORDERS ISSUE ===');
    console.log('Problem: orders.user_id column should reference users.id');
    
    try {
        // Get current auth user
        const authUser = localStorage.getItem('auth_user');
        if (!authUser) {
            console.error('❌ No authenticated user found');
            return;
        }
        
        const user = JSON.parse(authUser);
        console.log('✅ Current auth user:', {
            id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`
        });
        
        // Step 1: Check if user exists in users table with this ID
        console.log('\n🔍 Step 1: Checking users table...');
        const { data: userInDb, error: userError } = await supabase
            .from('users')
            .select('id, auth_id, email, first_name, last_name')
            .eq('id', user.id)
            .single();
            
        if (userError && userError.code !== 'PGRST116') {
            console.error('❌ Error checking user:', userError);
            return;
        }
        
        if (userInDb) {
            console.log('✅ User found in database:', userInDb);
        } else {
            console.log('❌ User NOT found in users table with ID:', user.id);
            
            // Check if user exists with different ID but same email
            const { data: userByEmail, error: emailError } = await supabase
                .from('users')
                .select('id, auth_id, email, first_name, last_name')
                .eq('email', user.email)
                .single();
                
            if (userByEmail) {
                console.log('🔄 Found user with same email but different ID:', userByEmail);
                console.log('This suggests the user record has a different ID than the auth ID');
                
                // Check if there are orders for this different user ID
                const { data: ordersForEmailUser, error: ordersError } = await supabase
                    .from('orders')
                    .select('id, user_id, order_number, total_amount')
                    .eq('user_id', userByEmail.id);
                    
                if (ordersForEmailUser && ordersForEmailUser.length > 0) {
                    console.log(`✅ FOUND ORDERS! This user has ${ordersForEmailUser.length} orders under ID: ${userByEmail.id}`);
                    console.log('Orders:', ordersForEmailUser);
                    
                    console.log('\n🔧 SOLUTION: Update auth context to use the correct user ID');
                    console.log('The problem is that auth is using ID:', user.id);
                    console.log('But orders are stored under ID:', userByEmail.id);
                    
                    return {
                        issue: 'ID_MISMATCH',
                        authUserId: user.id,
                        dbUserId: userByEmail.id,
                        ordersCount: ordersForEmailUser.length
                    };
                }
            } else {
                console.log('🔧 Creating missing user record...');
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        auth_id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        role: user.role || 'customer'
                    })
                    .select()
                    .single();
                    
                if (createError) {
                    console.error('❌ Error creating user:', createError);
                } else {
                    console.log('✅ User created successfully:', newUser);
                }
            }
        }
        
        // Step 2: Check orders for the current user ID
        console.log('\n🔍 Step 2: Checking orders for user ID:', user.id);
        const { data: userOrders, error: ordersError } = await supabase
            .from('orders')
            .select('id, user_id, order_number, status, total_amount, created_at')
            .eq('user_id', user.id);
            
        if (ordersError) {
            console.error('❌ Error fetching orders:', ordersError);
            return;
        }
        
        console.log(`📦 Found ${userOrders?.length || 0} orders for user ${user.id}`);
        
        if (userOrders && userOrders.length > 0) {
            console.log('✅ ORDERS FOUND! Details:', userOrders);
            console.log('\n🎉 SUCCESS: User has orders. They should be visible in My Orders page.');
        } else {
            console.log('❌ No orders found for this user ID');
            
            // Step 3: Check all orders to see if there are any with similar patterns
            console.log('\n🔍 Step 3: Checking all orders in database...');
            const { data: allOrders, error: allOrdersError } = await supabase
                .from('orders')
                .select('id, user_id, order_number, status, total_amount');
                
            if (allOrders && allOrders.length > 0) {
                console.log(`📋 Total orders in database: ${allOrders.length}`);
                console.log('Sample orders with user_ids:');
                allOrders.slice(0, 5).forEach((order, i) => {
                    console.log(`  Order ${i + 1}: user_id="${order.user_id}" (${typeof order.user_id}), order#${order.order_number}`);
                });
                
                // Check for potential ID format mismatches
                const uuidOrders = allOrders.filter(o => typeof o.user_id === 'string' && o.user_id.includes('-'));
                const intOrders = allOrders.filter(o => typeof o.user_id === 'number' || (typeof o.user_id === 'string' && !o.user_id.includes('-')));
                
                console.log(`📊 UUID-format user_ids: ${uuidOrders.length}`);
                console.log(`📊 Integer-format user_ids: ${intOrders.length}`);
                
                if (intOrders.length > 0) {
                    console.log('⚠️  WARNING: Found orders with integer-format user_ids');
                    console.log('This suggests orders were created before UUID migration');
                }
            } else {
                console.log('📭 No orders found in the entire database');
            }
        }
        
        // Step 4: Check all users to understand the data structure
        console.log('\n🔍 Step 4: Checking all users in database...');
        const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select('id, auth_id, email, first_name, last_name');
            
        if (allUsers && allUsers.length > 0) {
            console.log(`👥 Total users in database: ${allUsers.length}`);
            console.log('Sample users:');
            allUsers.slice(0, 5).forEach((u, i) => {
                console.log(`  User ${i + 1}: id="${u.id}", auth_id="${u.auth_id}", email="${u.email}"`);
            });
        }
        
    } catch (error) {
        console.error('💥 Fix script error:', error);
    }
}

// Auto-run the fix
console.log('🚀 Starting user orders diagnosis...');
fixUserOrdersIssue();