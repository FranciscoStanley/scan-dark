import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NetworkDevice } from '../../domain/entities/network-device.entity';
import { INetworkDeviceRepository } from '../../domain/repositories/network-device.repository';
import { NetworkDeviceOrmEntity } from './network-device.orm-entity';

@Injectable()
export class TypeOrmNetworkDeviceRepository implements INetworkDeviceRepository {
  constructor(
    @InjectRepository(NetworkDeviceOrmEntity)
    private readonly repository: Repository<NetworkDeviceOrmEntity>,
  ) {}

  async upsert(device: NetworkDevice): Promise<NetworkDevice> {
    const plain = device.toPlain();
    const identityKey = NetworkDevice.identityKey(plain.ipAddress, plain.macAddress);

    const existing = await this.repository.findOne({
      where: { identityKey, userId: plain.userId },
    });

    if (existing) {
      const domain = this.toDomain(existing);
      domain.refreshFromFingerprint({
        userId: plain.userId,
        ipAddress: plain.ipAddress,
        macAddress: plain.macAddress,
        hostname: plain.hostname,
        deviceType: plain.deviceType,
        vendor: plain.vendor,
        os: plain.os,
        openPorts: plain.openPorts,
        services: plain.services,
        riskScore: plain.riskScore,
        scanId: plain.scanId,
      });
      await this.repository.save(this.toOrm(domain, identityKey));
      return domain;
    }

    await this.repository.save(this.toOrm(device, identityKey));
    return device;
  }

  async findAllByUserId(userId: string): Promise<NetworkDevice[]> {
    const rows = await this.repository.find({ where: { userId }, order: { updatedAt: 'DESC' } });
    return rows.map((row) => this.toDomain(row));
  }

  async findByScanId(scanId: string, userId: string): Promise<NetworkDevice[]> {
    const rows = await this.repository.find({ where: { scanId, userId } });
    return rows.map((row) => this.toDomain(row));
  }

  private toOrm(device: NetworkDevice, identityKey: string): NetworkDeviceOrmEntity {
    const plain = device.toPlain();
    return this.repository.create({
      id: plain.id,
      userId: plain.userId,
      ipAddress: plain.ipAddress,
      macAddress: plain.macAddress,
      hostname: plain.hostname,
      deviceType: plain.deviceType,
      vendor: plain.vendor,
      os: plain.os,
      openPorts: plain.openPorts,
      services: plain.services,
      riskScore: plain.riskScore,
      scanId: plain.scanId,
      identityKey,
    });
  }

  private toDomain(row: NetworkDeviceOrmEntity): NetworkDevice {
    return NetworkDevice.reconstitute(
      row.id,
      {
        userId: row.userId,
        ipAddress: row.ipAddress,
        macAddress: row.macAddress,
        hostname: row.hostname,
        deviceType: row.deviceType,
        vendor: row.vendor,
        os: row.os,
        openPorts: row.openPorts,
        services: row.services,
        riskScore: row.riskScore,
        scanId: row.scanId,
      },
      row.createdAt,
      row.updatedAt,
    );
  }
}
