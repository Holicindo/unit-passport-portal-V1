import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const categorizeUnitType = (modelName: string): 'SHOWCASE' | 'MESIN' => {
  if (!modelName) return 'MESIN';
  const lowerName = modelName.toLowerCase();
  const showcaseKeywords = [
    'cold case', 
    'combination case', 
    'warm case', 
    'ambient case', 
    'blast freezer', 
    'showcase table'
  ];
  
  for (const keyword of showcaseKeywords) {
    if (lowerName.includes(keyword)) {
      return 'SHOWCASE';
    }
  }
  return 'MESIN';
};

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const res = await client.query('SELECT id, model_name, specs FROM units');
    console.log(`Found ${res.rowCount} units`);

    let updatedCount = 0;
    for (const row of res.rows) {
      const currentSpecs = row.specs || {};
      const newType = categorizeUnitType(row.model_name);
      
      if (currentSpecs.type !== newType) {
        currentSpecs.type = newType;
        await client.query('UPDATE units SET specs = $1 WHERE id = $2', [currentSpecs, row.id]);
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} units.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
