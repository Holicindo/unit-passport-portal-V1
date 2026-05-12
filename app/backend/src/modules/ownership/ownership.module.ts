import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnershipService } from './ownership.service';
import { OwnershipController } from './ownership.controller';
import { OwnershipHistory } from './entities/ownership-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OwnershipHistory])],
  controllers: [OwnershipController],
  providers: [OwnershipService],
  exports: [OwnershipService],
})
export class OwnershipModule {}
