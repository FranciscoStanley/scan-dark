import { DeviceResponse } from '@scandark/contracts';
import { NetworkDevice } from '../../domain/entities/network-device.entity';
import { INetworkDeviceRepository } from '../../domain/repositories/network-device.repository';
import { DeviceFingerprintEngine } from '../../domain/services/device-fingerprint.engine';

export interface FingerprintDeviceInput {
  userId: string;
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  openPorts: number[];
  scanId: string;
}

export class FingerprintDeviceUseCase {
  private readonly engine = new DeviceFingerprintEngine();

  constructor(private readonly repository: INetworkDeviceRepository) {}

  async execute(input: FingerprintDeviceInput): Promise<DeviceResponse> {
    const result = this.engine.classify(input);
    const device = NetworkDevice.create({
      userId: input.userId,
      ipAddress: input.ipAddress,
      macAddress: input.macAddress,
      hostname: input.hostname,
      deviceType: result.deviceType,
      vendor: result.vendor,
      os: result.os,
      openPorts: input.openPorts,
      services: result.services,
      riskScore: result.riskScore,
      scanId: input.scanId,
    });

    const saved = await this.repository.upsert(device);
    return toDeviceResponse(saved);
  }
}

export class ListDevicesUseCase {
  constructor(private readonly repository: INetworkDeviceRepository) {}

  async execute(userId: string): Promise<DeviceResponse[]> {
    const devices = await this.repository.findAllByUserId(userId);
    return devices.map(toDeviceResponse);
  }
}

export class ListDevicesByScanUseCase {
  constructor(private readonly repository: INetworkDeviceRepository) {}

  async execute(scanId: string, userId: string): Promise<DeviceResponse[]> {
    const devices = await this.repository.findByScanId(scanId, userId);
    return devices.map(toDeviceResponse);
  }
}

function toDeviceResponse(device: NetworkDevice): DeviceResponse {
  const plain = device.toPlain();
  return {
    id: plain.id,
    ipAddress: plain.ipAddress,
    macAddress: plain.macAddress,
    hostname: plain.hostname,
    deviceType: plain.deviceType,
    vendor: plain.vendor,
    os: plain.os,
    openPorts: plain.openPorts,
    riskScore: plain.riskScore,
    lastSeen: plain.lastSeen,
  };
}
