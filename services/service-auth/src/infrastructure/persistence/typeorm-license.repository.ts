import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { License } from '../../domain/entities/license.entity';
import { ILicenseRepository } from '../../domain/repositories/license.repository';
import { LicenseOrmEntity } from './license.orm-entity';

@Injectable()
export class TypeOrmLicenseRepository implements ILicenseRepository {
  constructor(
    @InjectRepository(LicenseOrmEntity)
    private readonly repository: Repository<LicenseOrmEntity>,
  ) {}

  async findActive(): Promise<License | null> {
    const row = await this.repository.findOne({
      where: { isActive: true },
      order: { activatedAt: 'DESC' },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByKey(licenseKey: string): Promise<License | null> {
    const row = await this.repository.findOne({ where: { licenseKey } });
    return row ? this.toDomain(row) : null;
  }

  async save(license: License): Promise<License> {
    const plain = license.toPlain();
    const orm = this.repository.create({
      id: plain.id,
      licenseKey: plain.licenseKey,
      organizationName: plain.organizationName,
      maxUsers: plain.maxUsers,
      features: plain.features,
      isActive: plain.isActive,
      activatedAt: plain.activatedAt,
      expiresAt: plain.expiresAt,
    });
    await this.repository.save(orm);
    return license;
  }

  private toDomain(row: LicenseOrmEntity): License {
    return License.reconstitute(
      row.id,
      {
        licenseKey: row.licenseKey,
        organizationName: row.organizationName,
        maxUsers: row.maxUsers,
        features: row.features,
        isActive: row.isActive,
        activatedAt: row.activatedAt,
        expiresAt: row.expiresAt,
      },
      row.createdAt,
      row.updatedAt,
    );
  }
}
