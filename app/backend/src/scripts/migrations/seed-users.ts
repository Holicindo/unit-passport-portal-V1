import { DataSource } from 'typeorm';
import { User, UserRole } from '../../modules/auth/entities/user.entity';
import { Client } from '../../modules/clients/entities/client.entity';
import { Partner } from '../../modules/partners/entities/partner.entity';
import { Unit } from '../../modules/units/entities/unit.entity';
import { ServiceLog } from '../../modules/service-logs/entities/service-log.entity';
import { Warranty } from '../../modules/warranties/entities/warranty.entity';
import { ServiceLogAttachment } from '../../modules/service-logs/entities/service-log-attachment.entity';
import { OwnershipHistory } from '../../modules/ownership/entities/ownership-history.entity';
import * as bcrypt from 'bcrypt';
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
  entities: [User, Client, Partner, Unit, ServiceLog, Warranty, ServiceLogAttachment, OwnershipHistory],
});

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const clientRepo = AppDataSource.getRepository(Client);
  const partnerRepo = AppDataSource.getRepository(Partner);
  const unitRepo = AppDataSource.getRepository(Unit);

  console.log('Starting Holicindo Seeder...');

  // 1. Get or create Client PT Indah Putih Cemerlang
  let client = await clientRepo.findOne({ where: { company_name: 'PT Indah Putih Cemerlang' } });
  if (!client) {
    client = clientRepo.create({
      company_name: 'PT Indah Putih Cemerlang',
      bp_code: 'CLI-IPC001',
      industry: 'RETAIL',
    });
    client = await clientRepo.save(client);
    console.log('Created Client: PT Indah Putih Cemerlang');
  }

  // 1b. Get or create Starbucks Client
  let starbucksClient = await clientRepo.findOne({ where: { company_name: 'Starbucks Indonesia' } });
  if (!starbucksClient) {
    starbucksClient = clientRepo.create({
      company_name: 'Starbucks Indonesia',
      bp_code: 'CLI-SBUX01',
      industry: 'F&B',
    });
    starbucksClient = await clientRepo.save(starbucksClient);
    console.log('Created Client: Starbucks Indonesia');
  }

  // 2. Get or create Partners (Jakarta = ON, Medan = OFF as per brief)
  let partnerMedan = await partnerRepo.findOne({ where: { partner_name: 'Partner Medan Official' } });
  if (!partnerMedan) {
    partnerMedan = partnerRepo.create({
      partner_name: 'Partner Medan Official',
      city: 'Medan',
      is_active: false, // Medan is off (fallback to HQ WhatsApp)
      contact_wa: '6281287120358',
    });
    partnerMedan = await partnerRepo.save(partnerMedan);
    console.log('Created Partner: Partner Medan (OFF)');
  } else {
    // Force active state to false for consistency with the brief
    partnerMedan.is_active = false;
    partnerMedan.contact_wa = '6281287120358';
    await partnerRepo.save(partnerMedan);
  }

  let partnerJakarta = await partnerRepo.findOne({ where: { partner_name: 'Partner Jakarta Official' } });
  if (!partnerJakarta) {
    partnerJakarta = partnerRepo.create({
      partner_name: 'Partner Jakarta Official',
      city: 'Jakarta',
      is_active: true, // Jakarta is active (Smart Routed)
      contact_wa: '6281287120358',
    });
    partnerJakarta = await partnerRepo.save(partnerJakarta);
    console.log('Created Partner: Partner Jakarta (ON)');
  } else {
    // Force active state to true for consistency with the brief
    partnerJakarta.is_active = true;
    partnerJakarta.contact_wa = '6281287120358';
    await partnerRepo.save(partnerJakarta);
  }

  // 3. Setup/assign Demo Unit with token holi-cp-001
  let unit = await unitRepo.findOne({ where: { qr_token: 'holi-cp-001' } });
  if (!unit) {
    // Try to find first unit without token and hijack it, or create a new one
    const existingUnit = await unitRepo.findOne({ where: {} });
    if (existingUnit) {
      existingUnit.qr_token = 'holi-cp-001';
      existingUnit.current_client = client;
      existingUnit.specs = { 
        compressor: 'Embraco 1/2 HP (Premium)', 
        refrigerant: 'R290 (Eco-Friendly)', 
        wattage: '450W',
        city: 'Jakarta'
      };
      await unitRepo.save(existingUnit);
      console.log(`Hijacked existing unit ${existingUnit.serial_number} for demo with token 'holi-cp-001'`);
    } else {
      const newUnit = unitRepo.create({
        serial_number: 'HOLI-CP-001',
        model_name: 'Premium Showcase Cooler HC-450',
        specs: { 
          compressor: 'Embraco 1/2 HP (Premium)', 
          refrigerant: 'R290 (Eco-Friendly)', 
          wattage: '450W',
          city: 'Jakarta'
        },
        current_client: client,
        production_date: new Date(),
        status: 'ACTIVE',
        qr_token: 'holi-cp-001',
      } as any);
      await unitRepo.save(newUnit);
      console.log('Created new demo unit HOLI-CP-001');
    }
  } else {
    // Make sure it has correct specifications & owner client
    unit!.current_client = client;
    if (!unit!.specs || !unit!.specs.compressor) {
      unit!.specs = {
        compressor: 'Embraco 1/2 HP (Premium)', 
        refrigerant: 'R290 (Eco-Friendly)', 
        wattage: '450W',
        city: 'Jakarta'
      };
    }
    await unitRepo.save(unit!);
  }

  // 3b. Setup Starbucks Unit (UNTSTRBCKS123)
  let sbuxUnit = await unitRepo.findOne({ where: { serial_number: 'UNTSTRBCKS123' } });
  if (!sbuxUnit) {
    sbuxUnit = unitRepo.create({
      serial_number: 'UNTSTRBCKS123',
      model_name: 'SHOWCASE TESTING',
      specs: { 
        compressor: 'Standard', 
        refrigerant: 'R134a', 
        wattage: '300W',
        city: 'Jakarta'
      },
      current_client: starbucksClient,
      production_date: new Date(),
      status: 'ACTIVE',
      qr_token: 'holi-cp-untstrbcks123',
    } as unknown as Unit);
    await unitRepo.save(sbuxUnit!);
    console.log('Created unit UNTSTRBCKS123 for Starbucks');
  } else {
    sbuxUnit!.current_client = starbucksClient;
    sbuxUnit!.qr_token = 'holi-cp-untstrbcks123';
    sbuxUnit!.model_name = 'SHOWCASE TESTING';
    await unitRepo.save(sbuxUnit!);
    console.log('Updated unit UNTSTRBCKS123 for Starbucks');
  }

  // 4. Seed user accounts
  const users = [
    { name: 'Super Admin', email: 'admin@holicindo.com', password: 'admin123', role: UserRole.ADMIN },
    { name: 'Teknisi Holicindo', email: 'tech@holicindo.com', password: 'tech123', role: UserRole.PARTNER, partner_id: partnerJakarta.id },
    { name: 'Ahmad Teknisi', email: 'ahmad@teknisihandal.com', password: 'password123', role: UserRole.PARTNER, partner_id: partnerJakarta.id },
    { name: 'PT Indah Putih Cemerlang', email: 'client@ipc.com', password: 'client123', role: UserRole.CLIENT, client_id: client.id },
    { name: 'Budi (Starbucks)', email: 'budi@starbucks.co.id', password: 'password123', role: UserRole.CLIENT, client_id: starbucksClient.id },
  ];

  for (const u of users) {
    let existing = await userRepo.findOne({ where: { email: u.email } });
    if (existing) {
      existing.role = u.role;
      if (u.client_id) existing.client_id = u.client_id;
      if (u.partner_id) existing.partner_id = u.partner_id;
      await userRepo.save(existing);
      console.log(`Updated existing user: ${u.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(u.password, 10);
    const user = userRepo.create({
      ...u,
      password: hashedPassword,
    });
    await userRepo.save(user);
    console.log(`Created ${u.role}: ${u.email}`);
  }

  // 5. Create a Mock Service Ticket for Demo
  const serviceLogRepo = AppDataSource.getRepository(ServiceLog);
  const targetDemoUnit = await unitRepo.findOne({ where: { qr_token: 'holi-cp-001' } });
  
  if (targetDemoUnit) {
    const existingLog = await serviceLogRepo.findOne({ where: { unit: { id: targetDemoUnit.id } } });
    if (!existingLog) {
      const mockLog = serviceLogRepo.create({
        unit: targetDemoUnit,
        partner: partnerJakarta,
        service_date: new Date(),
        technician_name: 'Pending Assignment',
        issue_description: 'Suhu chiller kurang dingin, hanya mencapai 10 derajat celcius. Mesin berbunyi agak kasar.',
        action_taken: 'Menunggu penugasan teknisi dan konfirmasi jadwal servis.',
        status: 'PENDING' as any,
      } as any);
      await serviceLogRepo.save(mockLog);
      console.log('Created Mock Service Ticket for Demo (Fase 3)');
    }
  }

  await AppDataSource.destroy();
  console.log('Holicindo Seeding completed successfully!');
}

seed().catch(console.error);
