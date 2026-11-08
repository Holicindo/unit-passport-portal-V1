import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceLogsService } from './service-logs.service';
import { ServiceLogsBulkService } from './service-logs-bulk.service';
import { ServiceLogsController } from './service-logs.controller';
import { ServiceLog } from './entities/service-log.entity';
import { ServiceLogAttachment } from './entities/service-log-attachment.entity';
import { Unit } from '../units/entities/unit.entity';
import { Client } from '../clients/entities/client.entity';

import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceLog, ServiceLogAttachment, Unit, Client]),
    StorageModule,
  ],
  controllers: [ServiceLogsController],
  providers: [ServiceLogsService, ServiceLogsBulkService],
  exports: [ServiceLogsService, ServiceLogsBulkService],
})
export class ServiceLogsModule { }
