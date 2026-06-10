import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LICENSE_CONFIG } from '@scandark/config';
import { License } from '../../domain/entities/license.entity';
import { ILicenseRepository, LICENSE_REPOSITORY } from '../../domain/repositories/license.repository';

@Injectable()
export class DefaultLicenseBootstrap implements OnModuleInit {
  private readonly logger = new Logger(DefaultLicenseBootstrap.name);

  constructor(
    @Inject(LICENSE_REPOSITORY) private readonly licenseRepository: ILicenseRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.licenseRepository.findActive();
    if (existing?.isValid()) {
      this.logger.log(`Active license: ${existing.organizationName}`);
      return;
    }

    const trialKey = await this.licenseRepository.findByKey(LICENSE_CONFIG.TRIAL_KEY);
    if (trialKey) {
      trialKey.activate();
      await this.licenseRepository.save(trialKey);
      this.logger.log(`Trial license activated: ${trialKey.organizationName}`);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LICENSE_CONFIG.TRIAL_DAYS);

    const license = License.create({
      licenseKey: LICENSE_CONFIG.TRIAL_KEY,
      organizationName: LICENSE_CONFIG.TRIAL_ORGANIZATION,
      maxUsers: 50,
      features: ['network_scan', 'device_discovery', 'vulnerability', 'threat_detection'],
      isActive: true,
      activatedAt: new Date(),
      expiresAt,
    });

    await this.licenseRepository.save(license);
    this.logger.log(`Trial license created: ${license.organizationName}`);
  }
}
