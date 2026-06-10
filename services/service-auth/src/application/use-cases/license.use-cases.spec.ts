import { describe, it, expect, vi, beforeEach } from 'vitest';
import { License } from '../../domain/entities/license.entity';
import { ILicenseRepository } from '../../domain/repositories/license.repository';
import { ActivateLicenseUseCase, GetLicenseStatusUseCase } from './license.use-cases';

describe('License use cases', () => {
  let repository: ILicenseRepository;

  beforeEach(() => {
    repository = {
      findActive: vi.fn(),
      findByKey: vi.fn(),
      save: vi.fn().mockImplementation(async (l) => l),
    };
  });

  it('returns active license status', async () => {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const license = License.create({
      licenseKey: 'SCANDARK-TEST',
      organizationName: 'Test Org',
      maxUsers: 10,
      features: ['network_scan'],
      isActive: true,
      activatedAt: new Date(),
      expiresAt,
    });
    vi.mocked(repository.findActive).mockResolvedValue(license);

    const useCase = new GetLicenseStatusUseCase(repository);
    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.value?.isValid()).toBe(true);
  });

  it('activates license by key', async () => {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const license = License.create({
      licenseKey: 'SCANDARK-PRO-0001',
      organizationName: 'Acme Corp',
      maxUsers: 25,
      features: ['all'],
      isActive: false,
      expiresAt,
    });
    vi.mocked(repository.findByKey).mockResolvedValue(license);

    const useCase = new ActivateLicenseUseCase(repository);
    const result = await useCase.execute('SCANDARK-PRO-0001');

    expect(result.success).toBe(true);
    expect(result.value?.isActive).toBe(true);
  });
});
