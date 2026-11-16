import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IotService } from './iot.service';
import { MqttService } from './mqtt.service';
import { IotController } from './iot.controller';
import { EmailAlertService } from './email-alert.service';
import { IotTelemetryLog } from './entities/iot-telemetry-log.entity';
import { Unit } from '../units/entities/unit.entity';
import { User } from '../auth/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IotTelemetryLog, Unit, User]),
    NotificationsModule, // Import agar IotService bisa pakai NotificationsService
  ],
  controllers: [IotController],
  providers: [IotService, MqttService, EmailAlertService],
  exports: [IotService, EmailAlertService],
})
export class IotModule {}
