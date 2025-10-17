#!/usr/bin/env node

/**
 * Populate Sample Data Script
 * Adds coupons, delivery locations, and categories to Supabase
 */

const { supabaseAdmin } = require('../src/config/supabase');
require('dotenv').config();

// Sample data to insert
const DELIVERY_LOCATIONS = [
  {
    city_name: 'Kwale',
    shopping_amount: 250.00,
    pickup_location: 'Kwale Main Shopping Center',
    pickup_phone: '+254701234567',
    pickup_status: 'active'
  },
  {
    city_name: 'Mombasa',
    shopping_amount: 200.00,
    pickup_location: 'Nyali City Mall',
    pickup_phone: '+254702345678',
    pickup_status: 'active'
  },
  {
    city_name: 'Kilifi',
    shopping_amount: 300.00,
    pickup_location: 'Kilifi Town Center',
    pickup_phone: '+254703456789',
    pickup_status: 'active'
  },
  {
    city_name: 'Malindi',
    shopping_amount: 350.00,
    pickup_location: 'Malindi Shopping Complex',
    pickup_phone: '+254704567890',
    pickup_status: 'active'
  },
  {
    city_name: 'Nairobi',
    shopping_amount: 150.00,
    pickup_location: 'Westgate Shopping Mall',
    pickup_phone: '+254705678901',
    pickup_status: 'active'
  },
  {
    city_name: 'Nakuru',
    shopping_amount: 280.00,
    pickup_location: 'Nakuru Central Plaza',
    pickup_phone: '+254706789012',
    pickup_status: 'active'
  },
  {
    city_name: 'Eldoret',
    shopping_amount: 320.00,
    pickup_location: 'Eldoret Main Market',
    pickup_phone: '+254707890123',
    pickup_status: 'active'
  },
  {
    city_name: 'Kisumu',
    shopping_amount: 300.00,
    pickup_location: 'Kisumu City Square',
    pickup_phone: '+254708901234',
    pickup_status: 'active'
  }
];

const CATEGORIES = [
  {
    name: 'Men\'s Shoes',
    slug: 'mens-shoes',
    description: 'Stylish and comfortable shoes for men',
    image_url: '/images/categories/mens-shoes.jpg',
    is_active: true
  },
  {
    name: 'Women\'s Shoes',
    slug: 'womens-shoes',
    description: 'Elegant and fashionable shoes for women',
    image_url: '/images/categories/womens-shoes.jpg',
    is_active: true
  },
  {
    name: 'Sneakers',
    slug: 'sneakers',
    description: 'Trendy sneakers for all occasions',
    image_url: '/images/categories/sneakers.jpg',
    is_active: true
  },
  {
    name: 'Boots',
    slug: 'boots',
    description: 'Durable boots for work and fashion',
    image_url: '/images/categories/boots.jpg',
    is_active: true
  },
  {
    name: 'Sandals',
    slug: 'sandals',
    description: 'Comfortable sandals for casual wear',
    image_url: '/images/categories/sandals.jpg',
    is_active: true
  },
  {
    name: 'Formal Shoes',
    slug: 'formal-shoes',
    description: 'Professional shoes for business and formal events',
    image_url: '/images/categories/formal-shoes.jpg',
    is_active: true
  },
  {
    name: 'Sports Shoes',
    slug: 'sports-shoes',
    description: 'Athletic shoes for sports and fitness',
    image_url: '/images/categories/sports-shoes.jpg',
    is_active: true
  },
  {
    name: 'Kids Shoes',
    slug: 'kids-shoes',
    description: 'Comfortable and fun shoes for children',
    image_url: '/images/categories/kids-shoes.jpg',
    is_active: true
  }
];

const COUPONS = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10.00,
    description: 'Welcome discount for new customers',
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    usage_limit: 100,
    used_count: 0,
    min_order_amount: 1000.00,
    is_active: true
  },
  {
    code: 'SAVE20',
    type: 'percentage',
    value: 20.00,
    description: '20% off on orders above KSh 2000',
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    usage_limit: 50,
    used_count: 0,
    min_order_amount: 2000.00,
    is_active: true
  },
  {
    code: 'FREESHIP',
    type: 'fixed',
    value: 200.00,
    description: 'Free shipping on orders above KSh 1500',
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    usage_limit: 200,
    used_count: 0,
    min_order_amount: 1500.00,
    is_active: true
  },
  {
    code: 'STUDENT15',
    type: 'percentage',
    value: 15.00,
    description: 'Student discount',
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    usage_limit: 75,
    used_count: 0,
    min_order_amount: 800.00,
    is_active: true
  },
  {
    code: 'FLASH25',
    type: 'percentage',
    value: 25.00,
    description: 'Flash sale - Limited time offer',
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    usage_limit: 25,
    used_count: 0,
    min_order_amount: 2500.00,
    is_active: true
  }
];

async function insertDeliveryLocations() {
  console.log('\n📍 Adding Delivery Locations...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .insert(DELIVERY_LOCATIONS)
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully added ${data.length} delivery locations:`);
    data.forEach(location => {
      console.log(`  📍 ${location.city_name} - KSh ${location.shopping_amount} (${location.pickup_location})`);
    });

    return { success: true, count: data.length };
  } catch (error) {
    console.error('❌ Failed to add delivery locations:', error.message);
    return { success: false, error: error.message };
  }
}

async function insertCategories() {
  console.log('\n👕 Adding Categories...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert(CATEGORIES)
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully added ${data.length} categories:`);
    data.forEach(category => {
      console.log(`  👕 ${category.name} (${category.slug})`);
    });

    return { success: true, count: data.length };
  } catch (error) {
    console.error('❌ Failed to add categories:', error.message);
    return { success: false, error: error.message };
  }
}

async function insertCoupons() {
  console.log('\n🎫 Adding Coupons...');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert(COUPONS)
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully added ${data.length} coupons:`);
    data.forEach(coupon => {
      const discountText = coupon.type === 'percentage' 
        ? `${coupon.value}%` 
        : `KSh ${coupon.value}`;
      console.log(`  🎫 ${coupon.code} - ${discountText} off (Min: KSh ${coupon.min_order_amount})`);
    });

    return { success: true, count: data.length };
  } catch (error) {
    console.error('❌ Failed to add coupons:', error.message);
    return { success: false, error: error.message };
  }
}

async function populateData() {
  console.log('🚀 Populating Supabase with Sample Data');
  console.log('=======================================');
  
  // Test Supabase connection
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection verified');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('\n⚠️ Make sure you have:');
    console.log('  1. Run the migration script in Supabase SQL Editor');
    console.log('  2. Set correct SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const results = {
    deliveryLocations: { success: false, count: 0 },
    categories: { success: false, count: 0 },
    coupons: { success: false, count: 0 }
  };

  // Insert data in order (no dependencies)
  results.deliveryLocations = await insertDeliveryLocations();
  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay

  results.categories = await insertCategories();
  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay

  results.coupons = await insertCoupons();

  // Summary
  console.log('\n📊 Data Population Summary');
  console.log('==========================');
  
  const successful = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Successfully populated: ${successful}/${total} tables`);
  
  if (results.deliveryLocations.success) {
    console.log(`📍 Delivery Locations: ${results.deliveryLocations.count} added`);
  }
  
  if (results.categories.success) {
    console.log(`👕 Categories: ${results.categories.count} added`);
  }
  
  if (results.coupons.success) {
    console.log(`🎫 Coupons: ${results.coupons.count} added`);
  }

  const failed = Object.entries(results).filter(([key, result]) => !result.success);
  if (failed.length > 0) {
    console.log('\n⚠️ Failed Tables:');
    failed.forEach(([key, result]) => {
      console.log(`  ❌ ${key}: ${result.error}`);
    });
  }

  if (successful === total) {
    console.log('\n🎉 All sample data has been successfully added to Supabase!');
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Start your backend server: npm start');
    console.log('2. Test the API endpoints');
    console.log('3. Add some sample products');
    console.log('4. Test the frontend with the new data');
  } else {
    console.log('\n⚠️ Some data insertion failed. Check the errors above.');
  }
}

// Handle script execution
if (require.main === module) {
  populateData()
    .then(() => {
      console.log('\n✅ Data population completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Data population failed:', error.message);
      process.exit(1);
    });
}

module.exports = { populateData, insertDeliveryLocations, insertCategories, insertCoupons };