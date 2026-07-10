const { Client } = require('pg');
const client = new Client({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.hsqpzvdejgzgpisjsvbe',
  password: 'Sysholicindo26',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect().then(() => {
  return client.query(`ALTER TABLE iot_telemetry_logs ALTER COLUMN recorded_at TYPE timestamptz USING recorded_at AT TIME ZONE 'UTC'`);
}).then(() => {
  console.log('Altered successfully');
  client.end();
}).catch(console.error);
