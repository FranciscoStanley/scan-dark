import { Injectable } from '@nestjs/common';
import { NetworkDevice } from '../../domain/entities/network-device.entity';
import { INetworkDeviceRepository } from '../../domain/repositories/network-device.repository';

@Injectable()
export class InMemoryNetworkDeviceRepository implements INetworkDeviceRepository {
  private readonly devices = new Map<string, NetworkDevice>();
  private readonly identityIndex = new Map<string, string>();

  async upsert(device: NetworkDevice): Promise<NetworkDevice> {
    const identityKey = `${device.userId}:${NetworkDevice.identityKey(device.ipAddress, device.macAddress)}`;
    const existingId = this.identityIndex.get(identityKey);

    if (existingId) {
      const existing = this.devices.get(existingId);
      if (existing) {
        const incoming = device.toPlain();
        existing.refreshFromFingerprint({
          userId: incoming.userId,
          ipAddress: incoming.ipAddress,
          macAddress: incoming.macAddress,
          hostname: incoming.hostname,
          deviceType: incoming.deviceType,
          vendor: incoming.vendor,
          os: incoming.os,
          openPorts: incoming.openPorts,
          services: incoming.services,
          riskScore: incoming.riskScore,
          scanId: incoming.scanId,
        });
        return existing;
      }
    }

    this.devices.set(device.id, device);
    this.identityIndex.set(identityKey, device.id);
    return device;
  }

  async findAllByUserId(userId: string): Promise<NetworkDevice[]> {
    return Array.from(this.devices.values()).filter((d) => d.userId === userId);
  }

  async findByScanId(scanId: string, userId: string): Promise<NetworkDevice[]> {
    return (await this.findAllByUserId(userId)).filter((device) => device.scanId === scanId);
  }
}
