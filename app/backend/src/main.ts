import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

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
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger Configuration
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

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api-docs`);
}
bootstrap();

