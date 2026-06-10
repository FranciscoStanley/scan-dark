import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SERVICE_PORTS, PROJECT_AUTHOR } from '@scandark/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3100' });

  const config = new DocumentBuilder()
    .setTitle('ScanDark — Authentication Service')
    .setDescription(
      'Microserviço de autenticação e autorização com JWT.\n\n' +
        '**Usuário padrão (bootstrap):** na inicialização, um usuário admin é criado automaticamente ' +
        'se ainda não existir no banco. Credenciais configuráveis via variáveis `DEFAULT_USER_*` ' +
        '(ver documentação em `docs/services/service-auth.md`).',
    )
    .setVersion('1.0')
    .setContact(PROJECT_AUTHOR.name, PROJECT_AUTHOR.url, PROJECT_AUTHOR.email)
    .addBearerAuth()
    .addTag('Authentication')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(SERVICE_PORTS.AUTH);
  console.log(`🔐 Auth Service running on http://localhost:${SERVICE_PORTS.AUTH}`);
  console.log(`📚 Swagger docs: http://localhost:${SERVICE_PORTS.AUTH}/docs`);
}

bootstrap();
