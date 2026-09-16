/**
 * fix-door-status.js
 * Reset is_door1_open & is_door2_open → false untuk unit A26051860
 * Run: node fix-door-status.js
 */
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('✅ Connected to DB');

  // Cek dulu data sekarang
  const check = await client.query(
    `SELECT id, serial_number, is_door1_open, is_door2_open, is_door3_open, is_door4_open
     FROM units WHERE serial_number = $1`,
    ['A26051860']
  );

  if (check.rows.length === 0) {
    console.log('❌ Unit A26051860 tidak ditemukan!');
    await client.end();
    return;
  }

  const unit = check.rows[0];
  console.log('📋 Data sekarang:', unit);

  // Update semua door status → false (tertutup)
  const result = await client.query(
    `UPDATE units
     SET is_door1_open = false,
         is_door2_open = false,
         is_door3_open = false,
         is_door4_open = false
     WHERE serial_number = $1
     RETURNING id, serial_number, is_door1_open, is_door2_open`,
    ['A26051860']
  );

  console.log('✅ Updated:', result.rows[0]);
  await client.end();
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
