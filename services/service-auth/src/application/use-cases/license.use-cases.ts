import { Result, ValidationError, NotFoundError } from '@scandark/shared-kernel';
import { License } from '../../domain/entities/license.entity';
import { ILicenseRepository } from '../../domain/repositories/license.repository';

export class GetLicenseStatusUseCase {
  constructor(private readonly licenseRepository: ILicenseRepository) {}

  async execute(): Promise<Result<License>> {
    const license = await this.licenseRepository.findActive();
    if (!license || !license.isValid()) {
      return Result.fail(new ValidationError('No active license found'));
    }
    return Result.ok(license);
  }
}

export class ActivateLicenseUseCase {
  constructor(private readonly licenseRepository: ILicenseRepository) {}

  async execute(licenseKey: string): Promise<Result<License>> {
    const license = await this.licenseRepository.findByKey(licenseKey.trim());
    if (!license) {
      return Result.fail(new NotFoundError('License', licenseKey));
    }

    if (license.expiresAt.getTime() < Date.now()) {
      return Result.fail(new ValidationError('License has expired'));
    }

    license.activate();
    const saved = await this.licenseRepository.save(license);
    return Result.ok(saved);
  }
}
