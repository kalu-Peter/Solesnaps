#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Supabase Migration Helper\n');

const SUPABASE_INSTRUCTIONS = `
📋 SUPABASE SETUP INSTRUCTIONS:

1. 🌐 CREATE SUPABASE PROJECT:
   - Go to https://supabase.com and create a new project
   - Choose a strong password for your database
   - Wait for the project to be ready (2-3 minutes)

2. 🔑 GET YOUR CREDENTIALS:
   - Go to Settings > API in your Supabase dashboard
   - Copy the following:
     * Project URL (looks like: https://abc123.supabase.co)
     * Anon public key (starts with: eyJ...)
     * Service role key (starts with: eyJ...)

3. 🗄️ GET DATABASE CONNECTION INFO:
   - Go to Settings > Database in your Supabase dashboard
   - Copy the connection details:
     * Host (looks like: db.abc123.supabase.co)
     * Database name (usually: postgres)
     * Port (usually: 5432)
     * Username (usually: postgres)
     * Password (the one you set when creating the project)

4. ⚙️ UPDATE ENVIRONMENT VARIABLES:
   
   Backend (.env file in server folder):
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_DB_HOST=db.your-project.supabase.co
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your-database-password

   Frontend (.env file in root folder):
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

5. 📊 RUN THE MIGRATION:
   - Copy the contents of server/migrations/0002_supabase_schema.sql
   - Go to your Supabase dashboard > SQL Editor
   - Paste the migration and run it
   - This will create all tables with proper security policies

6. 🔄 RESTART YOUR SERVERS:
   - Backend: npm run dev (in server folder)
   - Frontend: npm run dev (in root folder)

7. ✅ VERIFY CONNECTION:
   - Check the console logs for "Supabase connected successfully"
   - Try logging in/registering a user
   - Test cart and order functionality

🔧 MIGRATION OPTIONS:

Option A - Fresh Start (Recommended):
- Use the new Supabase database
- Manually re-create any important data
- Users will need to register again

Option B - Data Migration:
- Export data from your local PostgreSQL
- Import into Supabase using the SQL editor
- Note: You'll need to convert integer IDs to UUIDs

📞 SUPPORT:
If you need help with any step, check the Supabase documentation at:
https://supabase.com/docs

🎉 Once complete, you'll have:
- Automatic user authentication
- Real-time database updates
- Secure API endpoints
- Built-in file storage (if needed)
- Admin dashboard for database management
`;

function checkCurrentConfig() {
  console.log('🔍 Checking current configuration...\n');
  
  // Check if Supabase env vars exist
  const hasSupabaseUrl = !!process.env.SUPABASE_URL;
  const hasSupabaseKeys = !!(process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasSupabaseDb = !!(process.env.SUPABASE_DB_HOST && process.env.SUPABASE_DB_PASSWORD);
  
  console.log(`Supabase URL: ${hasSupabaseUrl ? '✅ Set' : '❌ Not set'}`);
  console.log(`Supabase Keys: ${hasSupabaseKeys ? '✅ Set' : '❌ Not set'}`);
  console.log(`Supabase DB Config: ${hasSupabaseDb ? '✅ Set' : '❌ Not set'}`);
  
  // Check local PostgreSQL
  const hasLocalDb = !!(process.env.DB_HOST || process.env.DB_NAME);
  console.log(`Local PostgreSQL: ${hasLocalDb ? '✅ Configured' : '❌ Not configured'}`);
  
  console.log('\n');
  
  if (hasSupabaseUrl && hasSupabaseKeys && hasSupabaseDb) {
    console.log('🎉 Supabase is fully configured!');
    console.log('Your app will use Supabase for database operations.');
  } else if (hasLocalDb) {
    console.log('🏠 Using local PostgreSQL database.');
    console.log('To switch to Supabase, follow the instructions below.');
  } else {
    console.log('⚠️  No database configuration found!');
    console.log('Please set up either local PostgreSQL or Supabase.');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

async function testConnections() {
  console.log('🧪 Testing database connections...\n');
  
  // Test local PostgreSQL if configured
  if (process.env.DB_HOST || process.env.DB_NAME) {
    try {
      const localConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5054,
        database: process.env.DB_NAME || 'soledb',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'webwiz',
      };
      
      const localPool = new Pool(localConfig);
      const result = await localPool.query('SELECT NOW()');
      console.log('✅ Local PostgreSQL connection successful');
      await localPool.end();
    } catch (error) {
      console.log('❌ Local PostgreSQL connection failed:', error.message);
    }
  }
  
  // Test Supabase if configured
  if (process.env.SUPABASE_DB_HOST && process.env.SUPABASE_DB_PASSWORD) {
    try {
      const supabaseConfig = {
        host: process.env.SUPABASE_DB_HOST,
        port: process.env.SUPABASE_DB_PORT || 5432,
        database: process.env.SUPABASE_DB_NAME || 'postgres',
        user: process.env.SUPABASE_DB_USER || 'postgres',
        password: process.env.SUPABASE_DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
      };
      
      const supabasePool = new Pool(supabaseConfig);
      const result = await supabasePool.query('SELECT NOW()');
      console.log('✅ Supabase database connection successful');
      await supabasePool.end();
    } catch (error) {
      console.log('❌ Supabase database connection failed:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

function showMigrationFiles() {
  console.log('📁 Available migration files:\n');
  
  const migrationsDir = path.join(__dirname, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    files.forEach(file => {
      console.log(`  📄 ${file}`);
      if (file.includes('supabase')) {
        console.log(`      Use this for Supabase setup`);
      } else {
        console.log(`      Use this for local PostgreSQL setup`);
      }
    });
  } else {
    console.log('  ❌ Migrations directory not found');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  console.log('This script helps you set up Supabase integration for SoleSnaps.\n');
  
  checkCurrentConfig();
  await testConnections();
  showMigrationFiles();
  console.log(SUPABASE_INSTRUCTIONS);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkCurrentConfig, testConnections };