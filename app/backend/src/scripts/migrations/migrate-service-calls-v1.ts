import { DataSource } from 'typeorm';
import { Client } from '../../modules/clients/entities/client.entity';
import { Unit } from '../../modules/units/entities/unit.entity';
import { ServiceLog } from '../../modules/service-logs/entities/service-log.entity';
import { Partner } from '../../modules/partners/entities/partner.entity';
import { User } from '../../modules/auth/entities/user.entity';
import { Warranty } from '../../modules/warranties/entities/warranty.entity';
import { ServiceLogAttachment } from '../../modules/service-logs/entities/service-log-attachment.entity';
import { OwnershipHistory } from '../../modules/ownership/entities/ownership-history.entity';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
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
  entities: [Client, Unit, Warranty, Partner, ServiceLog, ServiceLogAttachment, OwnershipHistory, User],
  synchronize: true, // Auto sync schema for this run
});

async function migrate() {
  await AppDataSource.initialize();
  console.log('Connected to Database');

  const csvPath = path.join(__dirname, '../../temp/service_calls.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  // Skip the first 4 lines (source header)
  const lines = fileContent.split('\n').slice(4).join('\n');
  
  const records = parse(lines, {
    columns: false,
    skip_empty_lines: true,
    from_line: 3,
    relax_column_count: true,
    relax_quotes: true,
    escape: '\\',
    quote: '"',
  });

  const clientRepo = AppDataSource.getRepository(Client);
  const unitRepo = AppDataSource.getRepository(Unit);
  const logRepo = AppDataSource.getRepository(ServiceLog);

  console.log(`Processing ${records.length} records...`);

  let count = 0;
  for (const record of records) {
    if (count > 1000) break; // Limit to 1000 for first run
    count++;
    
    try {
      const [
        callId, complainYear, executionDate, clientName, bpCode, 
        branch, address, itemDesc, itemCode, serialNumber,
        issue, handling, result, status, currentActivity, technician
      ] = record;

    if (!clientName || clientName === 'Name') continue;

    // 1. Find or Create Client
    let client = await clientRepo.findOne({ where: { company_name: clientName } });
    if (!client) {
      client = clientRepo.create({
        company_name: clientName,
        bp_code: bpCode,
        industry: 'Unknown', // Placeholder
      });
      await clientRepo.save(client);
    }

    // 2. Find or Create Unit (if serial exists)
    let unit: Unit | null = null;
    if (serialNumber && serialNumber !== '-' && serialNumber !== 'Serial Number') {
      unit = await unitRepo.findOne({ where: { serial_number: serialNumber } });
      if (!unit) {
        unit = unitRepo.create({
          serial_number: serialNumber,
          model_name: itemDesc || 'Unknown Model',
          current_client: client,
          qr_token: `TEMP-${serialNumber}`, // Placeholder QR
          specs: { item_code: itemCode, branch, address },
        });
        await unitRepo.save(unit);
      }
    }

    // 3. Create Service Log
    let serviceDate = new Date();
    try {
      if (executionDate && executionDate !== '-') {
        // Handle various formats: "Jan 2", "27-Feb-2018", "2/25/2018"
        const cleanDate = executionDate.replace(/-/g, ' ');
        const year = complainYear && complainYear !== '-' ? complainYear : '2018';
        
        // Try direct parsing
        let parsedDate = new Date(cleanDate);
        
        // If year is missing in cleanDate (e.g. "Jan 2"), append year
        if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2000) {
          parsedDate = new Date(`${cleanDate}, ${year}`);
        }
        
        if (!isNaN(parsedDate.getTime())) {
          serviceDate = parsedDate;
        }
      }
    } catch (e) {
      console.warn(`Failed to parse date for record ${count}: ${executionDate}`);
    }

    const log = logRepo.create({
      unit: unit as any, // Might be null if no serial
      issue_description: issue || record[10], // Issue column is 10 index
      action_taken: handling || 'No handling data',
      status: (status as any) || 'COMPLETED',
      technician_name: technician,
      service_date: serviceDate,
    } as any);

    // Note: If unit is null, we might need to adjust the entity to allow null unit 
    // or link it later. For now, we only save logs with units.
      if (unit) {
        await logRepo.save(log);
      }
    } catch (err) {
      console.error(`Error at record ${count}:`, err);
    }
  }

  console.log('Migration completed!');
  await AppDataSource.destroy();
}

migrate().catch(console.error);
