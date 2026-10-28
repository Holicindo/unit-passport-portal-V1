require('dotenv').config();
const { Pool } = require('pg');

async function checkUnits() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Check if units table exists
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'units'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Table units exists');
      
      // Get table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'units' 
        ORDER BY ordinal_position
      `);
      console.log('📋 Columns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Get constraints
      const constraints = await client.query(`
        SELECT 
          tc.constraint_name, tc.constraint_type,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'units'
      `);
      console.log('\n🔐 Constraints:');
      constraints.rows.forEach(c => {
        console.log(`  - ${c.constraint_name} (${c.constraint_type}) on ${c.column_name}`);
      });
      
      // Count units with IoT
      const iotUnits = await client.query('SELECT COUNT(*) as count FROM units WHERE iot_unit_id IS NOT NULL');
      console.log(`\n📊 Units with IoT: ${iotUnits.rows[0].count}`);
      
      // Show sample units
      const sample = await client.query('SELECT id, serial_number, iot_unit_id FROM units WHERE iot_unit_id IS NOT NULL LIMIT 2');
      console.log('\n📦 Sample units:');
      sample.rows.forEach(u => {
        console.log(`  - ID: ${u.id}, Serial: ${u.serial_number}, IoT: ${u.iot_unit_id}`);
      });
      
    } else {
      console.log('❌ Table units does not exist');
    }

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkUnits();
