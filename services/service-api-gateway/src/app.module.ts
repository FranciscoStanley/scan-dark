import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthModule } from '@scandark/nest-auth';
import { RATE_LIMIT_CONFIG } from '@scandark/config';
import { ServiceProxy } from './infrastructure/proxy/service.proxy';
import { GatewayController } from './presentation/controllers/gateway.controller';
import { LicenseGuard } from './presentation/guards/license.guard';

@Module({
  imports: [
    JwtAuthModule,
    HttpModule.register({ timeout: 30000 }),
    ThrottlerModule.forRoot([
      {
        ttl: RATE_LIMIT_CONFIG.TTL_MS,
        limit: RATE_LIMIT_CONFIG.LIMIT,
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [
    ServiceProxy,
    LicenseGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
