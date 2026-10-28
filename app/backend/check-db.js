require('dotenv').config();
const { Pool } = require('pg');

async function checkDatabase() {
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

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'iot_calibration'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Table iot_calibration already exists');
      
      // Check data
      const data = await client.query('SELECT * FROM iot_calibration');
      console.log(`📊 Records: ${data.rows.length}`);
      console.log(data.rows);
      
      // Check foreign key constraints
      const constraints = await client.query(`
        SELECT constraint_name, table_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'iot_calibration' AND constraint_type = 'FOREIGN KEY'
      `);
      console.log('🔐 Foreign keys:', constraints.rows);
      
      // Drop table
      console.log('🗑️  Dropping table...');
      await client.query('DROP TABLE IF EXISTS iot_calibration CASCADE');
      console.log('✅ Table dropped');
    } else {
      console.log('❌ Table iot_calibration does not exist');
    }

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
