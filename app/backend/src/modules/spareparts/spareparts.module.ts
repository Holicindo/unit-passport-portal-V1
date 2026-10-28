import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterSparepart } from './entities/sparepart.entity';
import { SparepartsService } from './spareparts.service';
import { SparepartsController } from './spareparts.controller';
import { ServiceLog } from '../service-logs/entities/service-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MasterSparepart, ServiceLog]),
  ],
  controllers: [SparepartsController],
  providers: [SparepartsService],
  exports: [SparepartsService],
})
export class SparepartsModule {}
