/**
 * SEED SCRIPT: Tambah 10 Unit Mock ke Akun Pameran FHI
 * Jalankan: npx ts-node -r tsconfig-paths/register src/seed-pameran.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { nanoid } from 'nanoid';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: String(process.env.DB_PASS || ''),
  database: process.env.DB_NAME || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  entities: [],
});

// Fungsi generate ID seperti sistem
function genId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix + '-';
  for (let i = 0; i < 7; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

const MOCK_UNITS = [
  {
    serial_number: 'A26051861',
    model_name: 'Cold Case CX3-1500',
    city: 'Bandung',
    outlet_branch: 'Trans Studio Mall, Jl. Gatot Subroto No.289, Cibangkong, Batununggal, Kota Bandung, Jawa Barat 40273',
    status: 'ACTIVE',
    production_date: '2025-01-10',
    warranty_expiry: '2027-01-10',
    specs: { type: 'SHOWCASE', capacity: '1500L', refrigerant: 'R290', wattage: '750W', voltage: '220V/50Hz', dimensions: '1800x750x1300mm' },
  },
  {
    serial_number: 'A26051862',
    model_name: 'Cold Case CX3-1000',
    city: 'Surabaya',
    outlet_branch: 'Galaxy Mall Surabaya, Jl. Dharmahusada Indah Timur No.35-37, Mulyorejo, Kec. Mulyorejo, Surabaya, Jawa Timur 60115',
    status: 'ACTIVE',
    production_date: '2025-02-15',
    warranty_expiry: '2027-02-15',
    specs: { type: 'SHOWCASE', capacity: '1000L', refrigerant: 'R290', wattage: '600W', voltage: '220V/50Hz', dimensions: '1500x750x1300mm' },
  },
  {
    serial_number: 'A26051863',
    model_name: 'Cold Case CX2-800',
    city: 'Medan',
    outlet_branch: 'Sun Plaza Medan, Jl. KH. Zainul Arifin No.7, Madras Hulu, Kec. Medan Polonia, Kota Medan, Sumatera Utara 20152',
    status: 'ACTIVE',
    production_date: '2025-03-05',
    warranty_expiry: '2027-03-05',
    specs: { type: 'SHOWCASE', capacity: '800L', refrigerant: 'R290', wattage: '500W', voltage: '220V/50Hz', dimensions: '1200x750x1300mm' },
  },
  {
    serial_number: 'A26051864',
    model_name: 'Cold Case CX3-1500',
    city: 'Makassar',
    outlet_branch: 'Mall Panakkukang, Jl. Boulevard, Masale, Kec. Panakkukang, Kota Makassar, Sulawesi Selatan 90231',
    status: 'ACTIVE',
    production_date: '2025-03-20',
    warranty_expiry: '2027-03-20',
    specs: { type: 'SHOWCASE', capacity: '1500L', refrigerant: 'R290', wattage: '750W', voltage: '220V/50Hz', dimensions: '1800x750x1300mm' },
  },
  {
    serial_number: 'A26051865',
    model_name: 'Cold Case CX2-600',
    city: 'Yogyakarta',
    outlet_branch: 'Pakuwon Mall Jogja, Jl. Ring Road Utara, Kaliwaru, Condongcatur, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281',
    status: 'MAINTENANCE',
    production_date: '2024-11-01',
    warranty_expiry: '2026-11-01',
    specs: { type: 'SHOWCASE', capacity: '600L', refrigerant: 'R290', wattage: '400W', voltage: '220V/50Hz', dimensions: '1000x750x1300mm' },
  },
  {
    serial_number: 'A26051866',
    model_name: 'Cold Case CX3-1200',
    city: 'Bali',
    outlet_branch: 'Discovery Shopping Mall, Jl. Kartika Plaza, Kuta, Kec. Kuta, Kabupaten Badung, Bali 80361',
    status: 'ACTIVE',
    production_date: '2025-04-10',
    warranty_expiry: '2027-04-10',
    specs: { type: 'SHOWCASE', capacity: '1200L', refrigerant: 'R290', wattage: '650W', voltage: '220V/50Hz', dimensions: '1600x750x1300mm' },
  },
  {
    serial_number: 'A26051867',
    model_name: 'Cold Case CX1-400',
    city: 'Semarang',
    outlet_branch: 'DP Mall Semarang, Jl. Pemuda No.150, Sekayu, Kec. Semarang Tengah, Kota Semarang, Jawa Tengah 50132',
    status: 'ACTIVE',
    production_date: '2025-01-25',
    warranty_expiry: '2027-01-25',
    specs: { type: 'SHOWCASE', capacity: '400L', refrigerant: 'R290', wattage: '320W', voltage: '220V/50Hz', dimensions: '800x700x1300mm' },
  },
  {
    serial_number: 'A26051868',
    model_name: 'Cold Case CX3-1500',
    city: 'Palembang',
    outlet_branch: 'Palembang Trade Center, Jl. R. Sukamto No.8A, 8 Ilir, Kec. Ilir Tim. II, Kota Palembang, Sumatera Selatan 30114',
    status: 'ACTIVE',
    production_date: '2025-05-01',
    warranty_expiry: '2027-05-01',
    specs: { type: 'SHOWCASE', capacity: '1500L', refrigerant: 'R290', wattage: '750W', voltage: '220V/50Hz', dimensions: '1800x750x1300mm' },
  },
  {
    serial_number: 'A26051869',
    model_name: 'Cold Case CX2-800',
    city: 'Balikpapan',
    outlet_branch: 'E-Walk Balikpapan Superblock, Jl. Jenderal Sudirman No.47, Gn. Bahagia, Kecamatan Balikpapan Selatan, Kota Balikpapan, Kalimantan Timur 76114',
    status: 'ACTIVE',
    production_date: '2025-04-20',
    warranty_expiry: '2027-04-20',
    specs: { type: 'SHOWCASE', capacity: '800L', refrigerant: 'R290', wattage: '500W', voltage: '220V/50Hz', dimensions: '1200x750x1300mm' },
  },
  {
    serial_number: 'A26051870',
    model_name: 'Cold Case CX3-1000',
    city: 'Manado',
    outlet_branch: 'Manado Town Square, Jl. Piere Tendean, Sario Tumpaan, Kec. Sario, Kota Manado, Sulawesi Utara',
    status: 'ACTIVE',
    production_date: '2025-05-15',
    warranty_expiry: '2027-05-15',
    specs: { type: 'SHOWCASE', capacity: '1000L', refrigerant: 'R290', wattage: '600W', voltage: '220V/50Hz', dimensions: '1500x750x1300mm' },
  },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ DB Connected');

    // 1. Cari client Pameran FHI
    const clientResult = await AppDataSource.query(
      `SELECT id, company_name FROM clients WHERE company_name ILIKE '%pameran%' OR email ILIKE '%holicindo%' ORDER BY created_at LIMIT 5`
    );
    console.log('Clients found:', clientResult);

    if (clientResult.length === 0) {
      console.error('❌ Client Pameran FHI tidak ditemukan. Pastikan sudah dibuat via portal.');
      process.exit(1);
    }

    // Pilih client yang paling cocok
    const client = clientResult.find((c: any) => 
      c.company_name?.toLowerCase().includes('pameran') || 
      c.company_name?.toLowerCase().includes('fhi')
    ) || clientResult[0];
    
    console.log(`\n🎯 Target Client: ${client.company_name} (${client.id})\n`);

    let added = 0;
    for (const unit of MOCK_UNITS) {
      // Cek apakah serial sudah ada
      const exists = await AppDataSource.query(
        `SELECT id FROM units WHERE serial_number = $1`, [unit.serial_number]
      );
      if (exists.length > 0) {
        // Update current_client, outlet_branch, city
        await AppDataSource.query(
          `UPDATE units SET "currentClientId" = $1, outlet_branch = $2, city = $3 WHERE serial_number = $4`,
          [client.id, unit.outlet_branch, unit.city, unit.serial_number]
        );
        console.log(`↩️  Updated existing: ${unit.serial_number}`);
        continue;
      }

      const id = genId('UNT');
      const qr_token = nanoid(12);

      await AppDataSource.query(`
        INSERT INTO units (
          id, serial_number, model_name, city, outlet_branch, status,
          production_date, warranty_expiry, specs, qr_token,
          "currentClientId", created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW())
      `, [
        id,
        unit.serial_number,
        unit.model_name,
        unit.city,
        unit.outlet_branch,
        unit.status,
        unit.production_date,
        unit.warranty_expiry,
        JSON.stringify(unit.specs),
        qr_token,
        client.id,
      ]);

      console.log(`✅ Added: ${unit.serial_number} — ${unit.model_name} (${unit.city})`);
      added++;
    }

    // Update unit_count client
    await AppDataSource.query(
      `UPDATE clients SET unit_count = (SELECT COUNT(*) FROM units WHERE "currentClientId" = $1) WHERE id = $1`,
      [client.id]
    );

    console.log(`\n🎉 Selesai! ${added} unit baru ditambahkan ke ${client.company_name}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seed();
