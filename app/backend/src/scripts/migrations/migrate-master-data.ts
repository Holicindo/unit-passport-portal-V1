import { DataSource } from 'typeorm';
import { Client } from '../../modules/clients/entities/client.entity';
import { Unit } from '../../modules/units/entities/unit.entity';
import { ServiceLog, ServiceStatus } from '../../modules/service-logs/entities/service-log.entity';
import { Partner } from '../../modules/partners/entities/partner.entity';
import { User, UserRole } from '../../modules/auth/entities/user.entity';
import { Warranty } from '../../modules/warranties/entities/warranty.entity';
import { ServiceLogAttachment } from '../../modules/service-logs/entities/service-log-attachment.entity';
import { OwnershipHistory } from '../../modules/ownership/entities/ownership-history.entity';
import axios from 'axios';
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
  entities: [Client, Unit, ServiceLog, Partner, User, Warranty, ServiceLogAttachment, OwnershipHistory],
  synchronize: true,
});

async function migrate() {
  await AppDataSource.initialize();
  console.log('Connected to Database');

  const clientRepo = AppDataSource.getRepository(Client);
  const unitRepo = AppDataSource.getRepository(Unit);

  // 1. CLEAR EXISTING DATA (Optional, but recommended for clean start)
  console.log('Clearing old data...');
  await unitRepo.query('TRUNCATE TABLE units CASCADE');
  await clientRepo.query('TRUNCATE TABLE clients CASCADE');

  // 2. FETCH MASTER CUSTOMER
  console.log('Fetching Master Customer Data...');
  const customerUrl = 'https://docs.google.com/spreadsheets/d/1OLOzUnsE4il5MbijLMoZwBu0K98zdmm4ou5n4YLwoQY/export?format=csv&gid=0';
  const customerRes = await axios.get(customerUrl);
  const customerRecords = parse(customerRes.data, { columns: false, skip_empty_lines: true });

  console.log(`Processing ${customerRecords.length - 1} customer records...`);
  const clientMap = new Map<string, string>(); // bp_code -> id

  for (let i = 1; i < customerRecords.length; i++) {
    const record = customerRecords[i];
    const bpCode = record[0]?.trim();
    const name = record[1]?.trim();
    const industry = record[22]?.trim(); // Column W is index 22

    if (bpCode && name) {
      const client = clientRepo.create({
        bp_code: bpCode,
        company_name: name,
        industry: industry || 'GENERAL',
      });
      const saved = await clientRepo.save(client);
      clientMap.set(bpCode, saved.id);
    }
  }
  console.log(`Migrated ${clientMap.size} clients.`);

  // 3. FETCH EQUIPMENT CARDS (No Seri)
  console.log('Fetching Equipment Card Data...');
  const serialUrl = 'https://docs.google.com/spreadsheets/d/17sx4lU44TBxV5URgj0wJzywmuT8OvdkK5uxuAeXUb38/export?format=csv&gid=0';
  const serialRes = await axios.get(serialUrl);
  const serialRecords = parse(serialRes.data, { columns: false, skip_empty_lines: true });

  console.log(`Processing ${serialRecords.length - 1} serial records...`);
  let unitCount = 0;
  const MAX_SERIAL_ROWS = 633; // Cut-off for 'Black' rows based on visual audit

  for (let i = 1; i < Math.min(serialRecords.length, MAX_SERIAL_ROWS); i++) {
    const record = serialRecords[i];
    const serialNumber = record[0]?.trim();
    const modelName = record[1]?.trim();
    const itemCode = record[2]?.trim();
    const customerCode = record[4]?.trim(); // Column E
    const startDateStr = record[9]?.trim(); // Column J

    // Filter: Only if Serial, Model, AND Customer Code exist (to avoid red/incomplete rows)
    if (serialNumber && modelName && customerCode && serialNumber !== 'Serial Number') {
      const clientId = clientMap.get(customerCode);
      
      if (!clientId) {
        console.warn(`Skipping unit ${serialNumber}: Customer code ${customerCode} not found in Master.`);
        continue;
      }
      
      let productionDate: Date | null = null;
      if (startDateStr) {
        const parsedDate = new Date(startDateStr);
        if (!isNaN(parsedDate.getTime())) productionDate = parsedDate;
      }

      const unit = unitRepo.create({
        serial_number: serialNumber,
        model_name: modelName,
        specs: { item_code: itemCode },
        current_client_id: clientId as any,
        production_date: productionDate,
        status: 'ACTIVE',
        qr_token: Math.random().toString(36).substring(2, 15), // Placeholder QR
      } as any);

      try {
        await unitRepo.save(unit);
        unitCount++;
      } catch (err) {
        console.error(`Failed to save unit ${serialNumber}:`, err.message);
      }
    }
  }

  console.log(`Migration completed! Total Units: ${unitCount}`);
  await AppDataSource.destroy();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
