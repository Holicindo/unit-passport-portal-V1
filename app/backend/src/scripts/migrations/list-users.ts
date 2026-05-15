import { DataSource } from 'typeorm';
import { User } from '../../modules/auth/entities/user.entity';
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

async function check() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find();
  console.log('Total Users:', users.length);
  users.forEach(u => console.log(`- ${u.email} (${u.role})`));
  await AppDataSource.destroy();
}

check().catch(console.error);
