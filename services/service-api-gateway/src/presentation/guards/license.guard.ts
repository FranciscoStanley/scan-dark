import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { INTERNAL_SERVICE_CONFIG, LICENSE_CONFIG, SERVICE_URLS } from '@scandark/config';

@Injectable()
export class LicenseGuard implements CanActivate {
  private readonly logger = new Logger(LicenseGuard.name);
  private cachedValid = false;
  private cacheExpiresAt = 0;

  constructor(private readonly http: HttpService) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    if (!LICENSE_CONFIG.REQUIRE_ACTIVE) {
      return true;
    }

    if (this.cachedValid && Date.now() < this.cacheExpiresAt) {
      return true;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<{ isActive: boolean }>(`${SERVICE_URLS.AUTH}/auth/license/status`, {
          headers: { 'x-internal-secret': INTERNAL_SERVICE_CONFIG.SECRET },
        }),
      );

      this.cachedValid = response.data.isActive;
      this.cacheExpiresAt = Date.now() + 5 * 60 * 1000;

      if (!this.cachedValid) {
        throw new ForbiddenException('License expired or inactive. Contact support to renew.');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.warn('License check failed — allowing request in degraded mode');
      return true;
    }
  }
}
