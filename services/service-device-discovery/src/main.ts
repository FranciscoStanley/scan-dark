import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SERVICE_PORTS, PROJECT_AUTHOR } from '@scandark/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3100' });

  const config = new DocumentBuilder()
    .setTitle('ScanDark — Device Discovery Service')
    .setDescription('Fingerprinting e classificação de dispositivos IoT, câmeras, TVs, roteadores')
    .setVersion('1.0')
    .setContact(PROJECT_AUTHOR.name)
    .addBearerAuth()
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  await app.listen(SERVICE_PORTS.DEVICE_DISCOVERY);
  console.log(`📱 Device Discovery: http://localhost:${SERVICE_PORTS.DEVICE_DISCOVERY}`);
}

bootstrap();
