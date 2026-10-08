import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitHealthScore } from './entities/unit-health-score.entity';
import { HealthScoreService } from './health-score.service';
import { HealthScoreController } from './health-score.controller';
import { IotTelemetryLog } from '../iot/entities/iot-telemetry-log.entity';
import { Unit } from '../units/entities/unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UnitHealthScore, IotTelemetryLog, Unit]),
  ],
  controllers: [HealthScoreController],
  providers: [HealthScoreService],
  exports: [HealthScoreService],
})
export class HealthScoreModule {}
