const bcrypt = require('bcryptjs');
const { query } = require('./src/config/database');

async function createAdminUser() {
  try {
    const email = 'admin@solesnaps.com';
    const password = 'Admin123!'; // Strong password
    
    // Check if admin user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const result = await query(
      `INSERT INTO users (first_name, last_name, email, password, role, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, first_name, last_name, email, role`,
      ['Admin', 'User', email, hashedPassword, 'admin', true]
    );

    console.log('Admin user created successfully:', result.rows[0]);
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

createAdminUser();