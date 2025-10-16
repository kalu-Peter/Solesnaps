const { query } = require('./server/src/config/database');
const bcrypt = require('bcryptjs');

async function createTestAdmin() {
  try {
    const email = 'testadmin@solesnaps.com';
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // First check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existing.rows.length > 0) {
      // Update existing user
      await query('UPDATE users SET password = $1, role = $2 WHERE email = $3', [hashedPassword, 'admin', email]);
      console.log('Updated existing user');
    } else {
      // Create new user
      await query(
        'INSERT INTO users (first_name, last_name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5, $6)',
        ['Test', 'Admin', email, hashedPassword, 'admin', true]
      );
      console.log('Created new admin user');
    }
    
    console.log('Test admin credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

createTestAdmin();