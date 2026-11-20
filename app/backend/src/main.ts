import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { migrateQrTokens } from './database/migrations/004_migrate_qr_tokens';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS for frontend access
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://portal.holicindo.com',
  ];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger Configuration
  if (process.env.ENABLE_SWAGGER === 'true' || process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Holicindo Unit Passport API [Phase 1]')
      .setDescription(
        'REST API for managing equipment lifecycles, warranties, and technical documentation. ' +
        'Implements 4 Access Levels: Public (QR), Client (Fleet), Partner (Technical), and Admin (Internal).',
      )
      .setVersion('1.0')
      .addTag('Authentication', 'Login and account management')
      .addTag('Units Management', 'Equipment tracking, QR scanning, and technical diagrams')
      .addTag('Clients Management', 'Customer data and fleet ownership')
      .addTag('Partners Management', 'Service technician network')
      .addTag('Warranties', 'Unit warranty periods')
      .addTag('Service Logs', 'Maintenance and repair records')
      .addBearerAuth()
      .build();
      
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  // Run one-time QR token migration on startup
  try {
    const { DataSource } = await import('typeorm');
    const dataSource = app.get(DataSource, { strict: false });
    if (dataSource) {
      await migrateQrTokens(dataSource);
    }
  } catch (e) {
    // Migration will run via Swagger endpoint instead if this fails
  }
  console.log(`Backend is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api-docs`);
}
bootstrap();

// Trigger restart
