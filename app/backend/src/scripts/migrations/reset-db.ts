import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function reset() {
  await AppDataSource.initialize();
  console.log('Resetting database...');
  
  const tables = ['service_log_attachments', 'service_logs', 'ownership_history', 'warranties', 'units', 'partners', 'clients', 'users'];
  
  for (const table of tables) {
    try {
      await AppDataSource.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      console.log(`Dropped table ${table}`);
    } catch (e) {
      console.error(`Failed to drop ${table}`, e);
    }
  }
  
  await AppDataSource.destroy();
  console.log('Database reset complete.');
}

reset().catch(console.error);
