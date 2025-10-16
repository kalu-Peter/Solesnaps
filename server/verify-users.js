require('dotenv').config();
const { query } = require('./src/config/database');

async function verifyAllUsers() {
  try {
    console.log('Updating all unverified users...');
    
    const result = await query(
      'UPDATE users SET is_verified = true WHERE is_verified = false RETURNING id, email, is_verified'
    );
    
    console.log(`Updated ${result.rows.length} users:`);
    console.table(result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAllUsers();