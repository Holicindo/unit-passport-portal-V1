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
  console.log('Connected...');

  // Update semua log untuk unit A26051860
  const r = await client.query(`
    UPDATE iot_telemetry_logs
    SET is_door1_open = false,
        is_door2_open = false,
        is_door3_open = false,
        is_door4_open = false
    WHERE unit_id = (SELECT id FROM units WHERE serial_number = 'A26051860')
  `);
  console.log('✅ Total log diupdate:', r.rowCount);

  // Juga update kolom di tabel units
  await client.query(`
    UPDATE units
    SET is_door1_open = false,
        is_door2_open = false,
        is_door3_open = false,
        is_door4_open = false
    WHERE serial_number = 'A26051860'
  `);
  console.log('✅ Tabel units juga direset');

  await client.end();
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
