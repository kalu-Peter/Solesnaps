require('dotenv').config();
const { query } = require('./src/config/database');

async function checkUsers() {
  try {
    // Check table structure
    console.log('=== Users Table Structure ===');
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    console.table(tableInfo.rows);

    // Check existing users
    console.log('\n=== Existing Users ===');
    const users = await query('SELECT id, email, is_verified, role FROM users LIMIT 10');
    console.table(users.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();