import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SERVICE_PORTS, PROJECT_AUTHOR } from '@scandark/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3100' });

  const config = new DocumentBuilder()
    .setTitle('ScanDark — Network Scan Service')
    .setDescription(
      'Descoberta de hosts, varredura de portas, auditoria WiFi/roteador, mDNS/SSDP/UPnP',
    )
    .setVersion('1.0')
    .setContact(PROJECT_AUTHOR.name)
    .addBearerAuth()
    .addTag('Network Scan')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(SERVICE_PORTS.NETWORK_SCAN);
  console.log(`🔍 Network Scan Service: http://localhost:${SERVICE_PORTS.NETWORK_SCAN}`);
}

bootstrap();
