const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASS || process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🔄 Running migration 015: Add QC role to enum...');
    console.log(`📦 Connecting to: ${process.env.DB_HOST}/${process.env.DB_NAME}`);

    const sql = fs.readFileSync(
      path.join(__dirname, 'src/database/migrations/015_add_qc_role_to_enum.sql'),
      'utf8'
    );

    await pool.query(sql);

    console.log('✅ Migration 015 executed successfully!');
    console.log('✅ QC role added to users_role_enum');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
