import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Client } from './modules/clients/entities/client.entity';
import { Unit } from './modules/units/entities/unit.entity';
import { Warranty } from './modules/warranties/entities/warranty.entity';
import { Partner } from './modules/partners/entities/partner.entity';
import { ServiceLog } from './modules/service-logs/entities/service-log.entity';
import { ServiceLogAttachment } from './modules/service-logs/entities/service-log-attachment.entity';
import { OwnershipHistory } from './modules/ownership/entities/ownership-history.entity';
import { User } from './modules/auth/entities/user.entity';
import { ServiceReport } from './modules/reports/entities/service-report.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { Conversation } from './modules/messages/entities/conversation.entity';
import { ChatMessage } from './modules/messages/entities/chat-message.entity';
import { UnitsModule } from './modules/units/units.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PartnersModule } from './modules/partners/partners.module';
import { WarrantiesModule } from './modules/warranties/warranties.module';
import { ServiceLogsModule } from './modules/service-logs/service-logs.module';
import { OwnershipModule } from './modules/ownership/ownership.module';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        ssl: config.get<string>('DB_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
        entities: [
          Client, Unit, Warranty, Partner,
          ServiceLog, ServiceLogAttachment, OwnershipHistory,
          User, ServiceReport, Notification, Conversation, ChatMessage,
        ],
        synchronize: config.get<string>('DB_SYNC') === 'true',
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
    }),

    UnitsModule,
    ClientsModule,
    PartnersModule,
    WarrantiesModule,
    ServiceLogsModule,
    OwnershipModule,
    AuthModule,
    StorageModule,
    ReportsModule,
    NotificationsModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
