import { DataSource } from 'typeorm';
import { User, UserRole } from '../../modules/auth/entities/user.entity';
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
  entities: [User],
});

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  console.log('Seeding users...');
  
  const users = [
    { name: 'Super Admin', email: 'admin@holicindo.com', password: 'admin123', role: UserRole.ADMIN },
    { name: 'Teknisi Holicindo', email: 'tech@holicindo.com', password: 'tech123', role: UserRole.PARTNER },
    { name: 'PT Indah Putih Cemerlang', email: 'client@ipc.com', password: 'client123', role: UserRole.CLIENT },
  ];

  for (const u of users) {
    const existing = await userRepo.findOne({ where: { email: u.email } });
    if (existing) {
      console.log(`User ${u.email} already exists.`);
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

  await AppDataSource.destroy();
  console.log('Seeding completed!');
}

seed().catch(console.error);
