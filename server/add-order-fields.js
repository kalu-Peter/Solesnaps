const { query } = require('./src/config/database');

async function addOrderFields() {
  try {
    console.log('🔄 Adding missing fields to orders table...');
    
    // Add subtotal_amount and shipping_amount columns if they don't exist
    await query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS shipping_amount DECIMAL(10,2)
    `);
    
    console.log('✅ Successfully added subtotal_amount and shipping_amount columns to orders table');
    
    // Verify the changes
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('subtotal_amount', 'shipping_amount')
      ORDER BY column_name
    `);
    
    console.log('📊 Added columns:');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding order fields:', error);
  } finally {
    process.exit();
  }
}

addOrderFields();