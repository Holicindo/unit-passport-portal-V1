require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'SystemHolicindo',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('📡 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');

    const sqlPath = path.join(__dirname, 'src', 'database', 'migrations', '013_create_iot_calibration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📄 Running migration: 013_create_iot_calibration.sql');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
    
    // Check if table exists
    const checkTable = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'iot_calibration'
    `);
    
    if (checkTable.rows.length > 0) {
      console.log('✅ Table iot_calibration exists');
      
      // Check records
      const countRecords = await client.query('SELECT COUNT(*) as count FROM iot_calibration');
      console.log(`📊 Found ${countRecords.rows[0].count} calibration records`);
    }

    client.release();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
