#!/usr/bin/env node

/**
 * Verify Sample Data Script
 * Shows what data was added to Supabase tables
 */

const { supabaseAdmin } = require('../src/config/supabase');
require('dotenv').config();

async function verifyData() {
  console.log('🔍 Verifying Sample Data in Supabase');
  console.log('===================================');
  
  try {
    // Check delivery locations
    console.log('\n📍 Delivery Locations:');
    const { data: locations, error: locError } = await supabaseAdmin
      .from('delivery_locations')
      .select('*')
      .order('city_name');

    if (locError) {
      console.error('❌ Error fetching locations:', locError.message);
    } else {
      console.log(`✅ Found ${locations.length} delivery locations:`);
      locations.forEach(location => {
        console.log(`  📍 ${location.city_name} - KSh ${location.shopping_amount}`);
        console.log(`     📍 ${location.pickup_location}`);
        console.log(`     📞 ${location.pickup_phone}`);
        console.log(`     🔄 Status: ${location.pickup_status}`);
        console.log('');
      });
    }

    // Check categories
    console.log('\n👕 Categories:');
    const { data: categories, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name');

    if (catError) {
      console.error('❌ Error fetching categories:', catError.message);
    } else {
      console.log(`✅ Found ${categories.length} categories:`);
      categories.forEach(category => {
        console.log(`  👕 ${category.name} (${category.slug})`);
        console.log(`     📝 ${category.description}`);
        console.log(`     ✅ Active: ${category.is_active}`);
        console.log('');
      });
    }

    // Check coupons
    console.log('\n🎫 Coupons:');
    const { data: coupons, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('code');

    if (couponError) {
      console.error('❌ Error fetching coupons:', couponError.message);
    } else {
      console.log(`✅ Found ${coupons.length} coupons:`);
      coupons.forEach(coupon => {
        const discountText = coupon.type === 'percentage' 
          ? `${coupon.value}%` 
          : `KSh ${coupon.value}`;
        const expiryDate = new Date(coupon.expires_at).toLocaleDateString();
        console.log(`  🎫 ${coupon.code} - ${discountText} off`);
        console.log(`     📝 ${coupon.description}`);
        console.log(`     💰 Min order: KSh ${coupon.min_order_amount}`);
        console.log(`     📅 Expires: ${expiryDate}`);
        console.log(`     🔢 Usage: ${coupon.used_count}/${coupon.usage_limit || '∞'}`);
        console.log(`     ✅ Active: ${coupon.is_active}`);
        console.log('');
      });
    }

    console.log('🎉 Data verification completed successfully!');
    console.log('\n🎯 Your Supabase database now has:');
    console.log(`📍 ${locations?.length || 0} delivery locations across Kenya`);
    console.log(`👕 ${categories?.length || 0} product categories`);
    console.log(`🎫 ${coupons?.length || 0} discount coupons`);

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Handle script execution
if (require.main === module) {
  verifyData()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    });
}

module.exports = { verifyData };