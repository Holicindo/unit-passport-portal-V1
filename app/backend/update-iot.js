const { Client } = require('pg');

async function updateIot() {
  const client = new Client({
    host: 'aws-1-ap-northeast-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.hsqpzvdejgzgpisjsvbe',
    password: 'Sysholicindo26',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Hapus dari unit lama (A1010159)
    await client.query("UPDATE units SET iot_unit_id = NULL WHERE serial_number = 'A1010159'");
    console.log("1. Berhasil menghapus koneksi dari unit lama A1010159.");

    // Masukkan ke unit pameran (A26051860)
    const res = await client.query("UPDATE units SET iot_unit_id = 'A26051860' WHERE serial_number = 'A26051860' RETURNING id, serial_number");
    
    if (res.rows.length > 0) {
      console.log(`2. ✅ BERHASIL! Unit ${res.rows[0].serial_number} sekarang terhubung dengan data IoT.`);
    } else {
      console.log("❌ GAGAL! Unit dengan serial number A26051860 tidak ditemukan di database.");
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

updateIot();
