import { DataSource } from 'typeorm';
import { Client } from '../../modules/clients/entities/client.entity';
import { Unit } from '../../modules/units/entities/unit.entity';
import { ServiceLog } from '../../modules/service-logs/entities/service-log.entity';
import { Partner } from '../../modules/partners/entities/partner.entity';
import { User } from '../../modules/auth/entities/user.entity';
import { Warranty } from '../../modules/warranties/entities/warranty.entity';
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

async function check() {
  await AppDataSource.initialize();
  const clientCount = await AppDataSource.getRepository(Client).count();
  const unitCount = await AppDataSource.getRepository(Unit).count();
  const logCount = await AppDataSource.getRepository(ServiceLog).count();
  
  console.log(`Clients: ${clientCount}`);
  console.log(`Units: ${unitCount}`);
  console.log(`Service Logs: ${logCount}`);
  
  await AppDataSource.destroy();
}

check().catch(console.error);
