const { query } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('Checking for existing admin users...');
    
    const existingAdmins = await query('SELECT * FROM users WHERE role = $1', ['admin']);
    
    if (existingAdmins.rows.length > 0) {
      console.log('✅ Admin user already exists:');
      existingAdmins.rows.forEach(admin => {
        console.log(`- ${admin.name} (${admin.email})`);
      });
      return;
    }
    
    console.log('Creating admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const result = await query(
      `INSERT INTO users (
        name, email, password, role, is_verified, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role`,
      [
        'Admin User',
        'admin@solesnaps.com',
        hashedPassword,
        'admin',
        true,
        true
      ]
    );

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@solesnaps.com');
    console.log('Password: admin123');
    console.log('User ID:', result.rows[0].id);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
  process.exit(0);
}

createAdminUser();