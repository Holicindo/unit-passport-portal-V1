const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'unit_passport_portal',
    user: 'postgres',
    password: 'Holi@2425',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sqlPath = path.join(__dirname, 'src', 'database', 'migrations', '013_create_iot_calibration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📄 Running migration: 013_create_iot_calibration.sql');
    await client.query(sql);
    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
