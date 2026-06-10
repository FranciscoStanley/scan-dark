import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SERVICE_PORTS, PROJECT_AUTHOR } from '@scandark/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3100' });

  const config = new DocumentBuilder()
    .setTitle('ScanDark — Threat Detection Service')
    .setDescription(
      'Detecção de intrusões: acessos indevidos a câmeras WiFi, RDP, SSH, movimentação lateral e dispositivos não autorizados',
    )
    .setVersion('1.0')
    .setContact(PROJECT_AUTHOR.name, PROJECT_AUTHOR.url, PROJECT_AUTHOR.email)
    .addBearerAuth()
    .addTag('Threat Detection')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  await app.listen(SERVICE_PORTS.THREAT_DETECTION);
  console.log(`🚨 Threat Detection: http://localhost:${SERVICE_PORTS.THREAT_DETECTION}`);
}

bootstrap();
