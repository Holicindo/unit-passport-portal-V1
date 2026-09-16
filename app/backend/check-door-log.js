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

  // Ambil log terbaru unit A26051860
  const res = await client.query(`
    SELECT l.id, l.recorded_at, l.is_door1_open, l.is_door2_open, l.is_door3_open, l.is_door4_open
    FROM iot_telemetry_logs l
    JOIN units u ON u.id = l.unit_id
    WHERE u.serial_number = 'A26051860'
    ORDER BY l.recorded_at DESC
    LIMIT 3
  `);

  console.log('📋 3 log terbaru:');
  console.table(res.rows);

  // Update log terbaru: set semua door = false
  if (res.rows.length > 0) {
    const updateRes = await client.query(`
      UPDATE iot_telemetry_logs
      SET is_door1_open = false,
          is_door2_open = false,
          is_door3_open = false,
          is_door4_open = false
      WHERE id = $1
      RETURNING id, is_door1_open, is_door2_open
    `, [res.rows[0].id]);
    console.log('✅ Log terbaru diupdate:', updateRes.rows[0]);
  }

  await client.end();
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
