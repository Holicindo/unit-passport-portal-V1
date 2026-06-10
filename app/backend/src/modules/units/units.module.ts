import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitsService } from './units.service';
import { UnitsBulkService } from './units-bulk.service';
import { UnitsSmartRoutingService } from './units-smart-routing.service';
import { UnitsController } from './units.controller';
import { Unit } from './entities/unit.entity';
import { Client } from '../clients/entities/client.entity';
import { OwnershipHistory } from '../ownership/entities/ownership-history.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Unit, Client, OwnershipHistory]),
    StorageModule,
  ],
  controllers: [UnitsController],
  providers: [UnitsService, UnitsBulkService, UnitsSmartRoutingService],
  exports: [UnitsService, UnitsBulkService, UnitsSmartRoutingService],
})
export class UnitsModule {}
