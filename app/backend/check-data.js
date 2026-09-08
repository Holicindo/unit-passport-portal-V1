const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'ali123',
  database: 'holicindo_dev'
});

async function checkData() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Get recent data for device A26071976
    const result = await client.query(`
      SELECT recorded_at, temp_cabinet, temp_evaporator, temp_condenser 
      FROM iot_telemetry_logs 
      WHERE iot_unit_id = $1 
      ORDER BY recorded_at DESC 
      LIMIT 15
    `, ['A26071976']);
    
    console.log('\nRecent 15 records for A26071976:');
    result.rows.forEach((row, i) => {
      const date = new Date(row.recorded_at);
      const formatted = date.toLocaleString('en-GB', { 
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log(`${i+1}. ${formatted} | Kab: ${row.temp_cabinet}°C | Evap: ${row.temp_evaporator}°C | Cond: ${row.temp_condenser}°C`);
    });
    
    // Check data count in last 24h
    const count24h = await client.query(`
      SELECT COUNT(*) as count
      FROM iot_telemetry_logs 
      WHERE iot_unit_id = $1 
      AND recorded_at >= NOW() - INTERVAL '24 hours'
    `, ['A26071976']);
    
    console.log(`\nTotal records in last 24h: ${count24h.rows[0].count}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkData();