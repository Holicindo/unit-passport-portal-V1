import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { Unit } from './entities/unit.entity';
import { Client } from '../clients/entities/client.entity';
import { OwnershipHistory } from '../ownership/entities/ownership-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Unit, Client, OwnershipHistory])],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitsModule {}
