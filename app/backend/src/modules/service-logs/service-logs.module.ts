import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceLogsService } from './service-logs.service';
import { ServiceLogsController } from './service-logs.controller';
import { ServiceLog } from './entities/service-log.entity';
import { ServiceLogAttachment } from './entities/service-log-attachment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceLog, ServiceLogAttachment])],
  controllers: [ServiceLogsController],
  providers: [ServiceLogsService],
  exports: [ServiceLogsService],
})
export class ServiceLogsModule {}
