// Setup delivery locations table and data
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5054,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'webwiz',
  database: process.env.DB_NAME || 'soledb',
};

async function setupDeliveryLocations() {
  const client = new Pool(dbConfig);
  
  try {
    console.log('🚀 Setting up delivery locations...');
    
    // Drop addresses table if it exists
    console.log('🗑️ Dropping old addresses table if it exists...');
    await client.query('DROP TABLE IF EXISTS addresses CASCADE');
    
    // Create delivery_locations table
    console.log('📦 Creating delivery_locations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_locations (
        id SERIAL PRIMARY KEY,
        city_name VARCHAR(100) NOT NULL UNIQUE,
        shopping_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        pickup_location VARCHAR(255) NOT NULL,
        pickup_phone VARCHAR(20) NOT NULL,
        pickup_status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert the specific cities and towns with their delivery details
    console.log('📝 Inserting delivery locations data...');
    
    const deliveryLocations = [
      {
        city_name: 'Kwale',
        shopping_amount: 150.00,
        pickup_location: 'Kwale Town Center, Near Kwale County Offices',
        pickup_phone: '+254712345001',
        pickup_status: 'active'
      },
      {
        city_name: 'Mombasa',
        shopping_amount: 200.00,
        pickup_location: 'City Mall Mombasa, Ground Floor',
        pickup_phone: '+254712345002',
        pickup_status: 'active'
      },
      {
        city_name: 'Nairobi',
        shopping_amount: 250.00,
        pickup_location: 'Westgate Shopping Mall, Level 2',
        pickup_phone: '+254712345003',
        pickup_status: 'active'
      },
      {
        city_name: 'Nakuru',
        shopping_amount: 180.00,
        pickup_location: 'Nakuru Town Plaza, Shop G12',
        pickup_phone: '+254712345004',
        pickup_status: 'active'
      },
      {
        city_name: 'Eldoret',
        shopping_amount: 170.00,
        pickup_location: 'Zion Mall Eldoret, Ground Floor',
        pickup_phone: '+254712345005',
        pickup_status: 'active'
      },
      {
        city_name: 'Malindi',
        shopping_amount: 160.00,
        pickup_location: 'Malindi Town Square, Near Bus Station',
        pickup_phone: '+254712345006',
        pickup_status: 'active'
      },
      {
        city_name: 'Mtwapa',
        shopping_amount: 140.00,
        pickup_location: 'Mtwapa Shopping Center, Main Street',
        pickup_phone: '+254712345007',
        pickup_status: 'active'
      }
    ];
    
    for (const location of deliveryLocations) {
      await client.query(`
        INSERT INTO delivery_locations (city_name, shopping_amount, pickup_location, pickup_phone, pickup_status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (city_name) DO UPDATE SET
          shopping_amount = EXCLUDED.shopping_amount,
          pickup_location = EXCLUDED.pickup_location,
          pickup_phone = EXCLUDED.pickup_phone,
          pickup_status = EXCLUDED.pickup_status,
          updated_at = CURRENT_TIMESTAMP
      `, [
        location.city_name,
        location.shopping_amount,
        location.pickup_location,
        location.pickup_phone,
        location.pickup_status
      ]);
    }
    
    // Update orders table to reference delivery_locations instead of addresses
    console.log('🔄 Updating orders table schema...');
    
    // Add delivery_location_id column if it doesn't exist
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS delivery_location_id INTEGER REFERENCES delivery_locations(id)
    `);
    
    // Create index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_delivery_location ON orders(delivery_location_id)
    `);
    
    // Display created locations
    console.log('📋 Delivery locations created:');
    const result = await client.query(`
      SELECT city_name, shopping_amount, pickup_location, pickup_phone, pickup_status 
      FROM delivery_locations 
      ORDER BY city_name
    `);
    
    console.table(result.rows);
    
    console.log('✅ Delivery locations setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

// Function to get all delivery locations (for API use)
async function getDeliveryLocations() {
  const client = new Pool(dbConfig);
  
  try {
    const result = await client.query(`
      SELECT id, city_name, shopping_amount, pickup_location, pickup_phone, pickup_status
      FROM delivery_locations 
      WHERE pickup_status = 'active'
      ORDER BY city_name
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching delivery locations:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Function to update delivery location
async function updateDeliveryLocation(id, updateData) {
  const client = new Pool(dbConfig);
  
  try {
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updateData)];
    
    const result = await client.query(`
      UPDATE delivery_locations 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, values);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating delivery location:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDeliveryLocations();
}

module.exports = { 
  setupDeliveryLocations, 
  getDeliveryLocations, 
  updateDeliveryLocation 
};