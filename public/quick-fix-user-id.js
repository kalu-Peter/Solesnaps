// Quick fix for user ID mismatch issue
// Run this in browser console if orders still don't show after the auth context fix

console.log('🔧 FIXING USER ID MISMATCH ISSUE');
console.log('Problem: Auth context uses auth_id, but orders.user_id references users.id');

async function quickFixUserIdMismatch() {
    try {
        // Import supabase
        const { supabase } = await import('./src/lib/supabase.js');
        
        if (!supabase) {
            console.error('❌ Supabase client not available');
            return;
        }

        // Get current auth user from localStorage
        const authUserStr = localStorage.getItem('auth_user');
        if (!authUserStr) {
            console.error('❌ No authenticated user found');
            return;
        }

        const authUser = JSON.parse(authUserStr);
        console.log('🔍 Current auth user:', authUser);
        console.log('🔍 Auth user ID (might be auth_id):', authUser.id);

        // Check if this ID exists in users table
        console.log('\n1️⃣ Checking if user exists by ID...');
        const { data: userById, error: userByIdError } = await supabase
            .from('users')
            .select('id, auth_id, email, first_name, last_name')
            .eq('id', authUser.id)
            .single();

        if (userById && !userByIdError) {
            console.log('✅ User found by ID:', userById);
            
            // Check orders for this user
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, user_id, order_number, total_amount')
                .eq('user_id', userById.id);
                
            console.log(`📦 Orders for this user: ${orders?.length || 0}`);
            if (orders && orders.length > 0) {
                console.log('✅ ORDERS FOUND! The fix is working.');
                return;
            }
        }

        // If not found by ID, check by auth_id
        console.log('\n2️⃣ Checking if user exists by auth_id...');
        const { data: userByAuthId, error: authIdError } = await supabase
            .from('users')
            .select('id, auth_id, email, first_name, last_name')
            .eq('auth_id', authUser.id)
            .single();

        if (userByAuthId && !authIdError) {
            console.log('✅ User found by auth_id:', userByAuthId);
            console.log('🔄 This means the auth context needs to use users.id, not auth_id');
            
            // Check orders for the correct user ID
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, user_id, order_number, total_amount')
                .eq('user_id', userByAuthId.id);
                
            console.log(`📦 Orders for correct user ID: ${orders?.length || 0}`);
            
            if (orders && orders.length > 0) {
                console.log('✅ ORDERS FOUND!');
                console.log(`🔧 SOLUTION: Update localStorage to use correct user ID`);
                
                // Update the auth user in localStorage
                const updatedAuthUser = {
                    ...authUser,
                    id: userByAuthId.id  // Use the database users.id, not auth_id
                };
                
                localStorage.setItem('auth_user', JSON.stringify(updatedAuthUser));
                
                console.log('✅ Auth user updated in localStorage');
                console.log('🔄 Please refresh the page to see your orders');
                
                return;
            }
        }

        // If still no user found, check by email
        console.log('\n3️⃣ Checking if user exists by email...');
        const { data: userByEmail, error: emailError } = await supabase
            .from('users')
            .select('id, auth_id, email, first_name, last_name')
            .eq('email', authUser.email)
            .single();

        if (userByEmail && !emailError) {
            console.log('✅ User found by email:', userByEmail);
            
            // Check orders for this user
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, user_id, order_number, total_amount')
                .eq('user_id', userByEmail.id);
                
            console.log(`📦 Orders for email user: ${orders?.length || 0}`);
            
            if (orders && orders.length > 0) {
                console.log('✅ ORDERS FOUND!');
                console.log(`🔧 SOLUTION: Update auth_id and localStorage`);
                
                // Update the user record to have correct auth_id
                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update({ auth_id: authUser.id })
                    .eq('id', userByEmail.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('❌ Failed to update user auth_id:', updateError);
                } else {
                    console.log('✅ User auth_id updated in database');
                }
                
                // Update the auth user in localStorage
                const updatedAuthUser = {
                    ...authUser,
                    id: userByEmail.id  // Use the database users.id
                };
                
                localStorage.setItem('auth_user', JSON.stringify(updatedAuthUser));
                
                console.log('✅ Auth user updated in localStorage');
                console.log('🔄 Please refresh the page to see your orders');
                
                return;
            }
        }

        console.log('❌ No user found or no orders exist for this user');
        
    } catch (error) {
        console.error('💥 Fix script error:', error);
    }
}

// Run the fix
quickFixUserIdMismatch();