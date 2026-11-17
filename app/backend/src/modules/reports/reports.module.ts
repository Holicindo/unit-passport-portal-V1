import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ServiceReport } from './entities/service-report.entity';
import { Unit } from '../units/entities/unit.entity';
import { ServiceLog } from '../service-logs/entities/service-log.entity';
import { UnitHealthScore } from '../health-score/entities/unit-health-score.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { IotTelemetryLog } from '../iot/entities/iot-telemetry-log.entity';

import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceReport,
      Unit,
      ServiceLog,
      UnitHealthScore,
      Notification,
      IotTelemetryLog,
    ]),
    StorageModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
