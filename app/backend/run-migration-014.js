const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    host: 'holicindo-passport-db.cty80wocotu9.ap-southeast-2.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'SystemHolicindo',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sqlPath = path.join(__dirname, 'src', 'database', 'migrations', '014_create_operational_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📄 Running migration: 014_create_operational_tables.sql');
    await client.query(sql);
    console.log('✅ Migration completed successfully');
    console.log('📋 Created tables: deliveries, installations, invoices');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
