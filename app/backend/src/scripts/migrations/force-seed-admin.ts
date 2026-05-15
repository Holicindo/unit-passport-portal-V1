import { DataSource } from 'typeorm';
import { User, UserRole } from '../../modules/auth/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Client } from '../../modules/clients/entities/client.entity';
import { Unit } from '../../modules/units/entities/unit.entity';
import { Warranty } from '../../modules/warranties/entities/warranty.entity';
import { Partner } from '../../modules/partners/entities/partner.entity';
import { ServiceLog } from '../../modules/service-logs/entities/service-log.entity';
import { ServiceLogAttachment } from '../../modules/service-logs/entities/service-log-attachment.entity';
import { OwnershipHistory } from '../../modules/ownership/entities/ownership-history.entity';

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
});

async function run() {
  try {
    console.log('Connecting to database...', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      db: process.env.DB_NAME
    });
    await AppDataSource.initialize();
    console.log('Database connected!');
    const userRepo = AppDataSource.getRepository(User);
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@holicindo.com';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    
    console.log(`Checking for existing user: ${adminEmail}`);
    // Clear existing to be sure
    await userRepo.delete({ email: adminEmail });
    console.log('Deleted existing user if any.');
    
    const hashedPassword = await bcrypt.hash(adminPass, 10);
    const admin = userRepo.create({
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    
    await userRepo.save(admin);
    console.log(`Account ${adminEmail} RE-CREATED successfully!`);
  } catch (err) {
    console.error('FAILED to re-create account:', err);
  } finally {
    await AppDataSource.destroy();
  }
}

run();
