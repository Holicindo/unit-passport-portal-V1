const { Client } = require('pg');

async function assignIot() {
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
    
    // Get the first unit
    const res = await client.query('SELECT id, serial_number FROM units LIMIT 1');
    if (res.rows.length > 0) {
      const unit = res.rows[0];
      console.log(`Setting iot_unit_id = 'HC-0001' for unit ${unit.serial_number} (${unit.id})`);
      
      await client.query("UPDATE units SET iot_unit_id = 'HC-0001' WHERE id = $1", [unit.id]);
      console.log('✅ Update successful!');
    } else {
      console.log('No units found in the database.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

assignIot();
