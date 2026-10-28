import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallationsService } from './installations.service';
import { InstallationsController } from './installations.controller';
import { Installation } from './entities/installation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Installation])],
  controllers: [InstallationsController],
  providers: [InstallationsService],
  exports: [InstallationsService],
})
export class InstallationsModule {}
