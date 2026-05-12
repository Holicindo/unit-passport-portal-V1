import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Client } from './entities/client.entity';
import { Unit } from './entities/unit.entity';
import { Warranty } from './entities/warranty.entity';
import { Partner } from './entities/partner.entity';
import { ServiceLog } from './entities/service-log.entity';
import { ServiceLogAttachment } from './entities/service-log-attachment.entity';
import { OwnershipHistory } from './entities/ownership-history.entity';
import { UnitsModule } from './units/units.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          Client,
          Unit,
          Warranty,
          Partner,
          ServiceLog,
          ServiceLogAttachment,
          OwnershipHistory,
        ],
        synchronize: true, // Set to false in production
      }),
    }),
    UnitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
