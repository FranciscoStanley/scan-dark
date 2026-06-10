import { License } from '../entities/license.entity';

export interface ILicenseRepository {
  findActive(): Promise<License | null>;
  findByKey(licenseKey: string): Promise<License | null>;
  save(license: License): Promise<License>;
}

export const LICENSE_REPOSITORY = Symbol('LICENSE_REPOSITORY');
