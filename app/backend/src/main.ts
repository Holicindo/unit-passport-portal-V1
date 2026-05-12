import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend access
  app.enableCors();

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Holicindo Unit Passport API')
    .setDescription('Documentation for Holicindo Unit Passport Management Portal')
    .setVersion('1.0')
    .addTag('units')
    .addTag('clients')
    .addTag('partners')
    .addTag('warranties')
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

