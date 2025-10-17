const { query } = require('../src/config/database');

async function extractSchema() {
  try {
    console.log('Extracting complete database schema...\n');
    
    // Get all tables
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    console.log('\n=== TABLE SCHEMAS ===\n');
    
    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;
      
      // Get columns for this table
      const columnsResult = await query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log(`Table: ${tableName}`);
      console.log('Columns:');
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
      });
      
      // Get constraints (foreign keys, unique, etc.)
      const constraintsResult = await query(`
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_name = $1 AND tc.table_schema = 'public'
      `, [tableName]);
      
      if (constraintsResult.rows.length > 0) {
        console.log('Constraints:');
        constraintsResult.rows.forEach(constraint => {
          if (constraint.constraint_type === 'FOREIGN KEY') {
            console.log(`  FK: ${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
          } else if (constraint.constraint_type === 'UNIQUE') {
            console.log(`  UNIQUE: ${constraint.column_name}`);
          } else if (constraint.constraint_type === 'PRIMARY KEY') {
            console.log(`  PRIMARY KEY: ${constraint.column_name}`);
          }
        });
      }
      
      // Get indexes
      const indexesResult = await query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1 AND schemaname = 'public'
        ORDER BY indexname
      `, [tableName]);
      
      if (indexesResult.rows.length > 0) {
        console.log('Indexes:');
        indexesResult.rows.forEach(idx => {
          console.log(`  ${idx.indexname}: ${idx.indexdef}`);
        });
      }
      
      console.log(''); // Empty line between tables
    }
    
  } catch (error) {
    console.error('Error extracting schema:', error.message);
  }
  process.exit(0);
}

extractSchema();