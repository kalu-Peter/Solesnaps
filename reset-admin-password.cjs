const bcrypt = require('bcryptjs');
const { query } = require('./server/src/config/database');

async function resetAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const result = await query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, 'admin@solesnaps.com']);
    console.log('Admin password reset to: admin123');
    console.log('Rows updated:', result.rowCount);
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

resetAdminPassword();