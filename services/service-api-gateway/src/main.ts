import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SERVICE_PORTS, PROJECT_AUTHOR } from '@scandark/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3100',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('ScanDark — API Gateway')
    .setDescription('Ponto de entrada unificado para todos os microserviços de segurança de rede')
    .setVersion('1.0')
    .setContact(PROJECT_AUTHOR.name)
    .addBearerAuth()
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(SERVICE_PORTS.API_GATEWAY);
  console.log(`🚀 API Gateway: http://localhost:${SERVICE_PORTS.API_GATEWAY}`);
  console.log(`📚 Swagger: http://localhost:${SERVICE_PORTS.API_GATEWAY}/docs`);
}

bootstrap();
