import { Injectable, Logger } from '@nestjs/common';
import { INTERNAL_SERVICE_CONFIG, SERVICE_URLS } from '@scandark/config';
import { DiscoveredHost } from '../../domain/entities/network-scan.entity';

export interface FingerprintedDevice {
  id: string;
  ipAddress: string;
  hostname?: string;
  deviceType: string;
  vendor?: string;
  openPorts: number[];
  riskScore: number;
}

export interface IDeviceDiscoveryClient {
  fingerprintHosts(
    hosts: DiscoveredHost[],
    scanId: string,
    userId: string,
  ): Promise<FingerprintedDevice[]>;
}

@Injectable()
export class HttpDeviceDiscoveryClient implements IDeviceDiscoveryClient {
  private readonly logger = new Logger(HttpDeviceDiscoveryClient.name);
  private readonly baseUrl = SERVICE_URLS.DEVICE_DISCOVERY;

  async fingerprintHosts(
    hosts: DiscoveredHost[],
    scanId: string,
    userId: string,
  ): Promise<FingerprintedDevice[]> {
    const aliveHosts = hosts.filter((h) => h.isAlive);
    const results: FingerprintedDevice[] = [];

    for (const host of aliveHosts) {
      try {
        const response = await fetch(`${this.baseUrl}/devices/fingerprint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': INTERNAL_SERVICE_CONFIG.SECRET,
            'x-user-id': userId,
          },
          body: JSON.stringify({
            ipAddress: host.ipAddress,
            macAddress: host.macAddress,
            hostname: host.hostname,
            openPorts: host.openPorts ?? [],
            scanId,
          }),
        });

        if (!response.ok) {
          this.logger.warn(`Fingerprint failed for ${host.ipAddress}: HTTP ${response.status}`);
          continue;
        }

        const device = (await response.json()) as FingerprintedDevice;
        results.push(device);
      } catch (error) {
        this.logger.warn(
          `Fingerprint failed for ${host.ipAddress}: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }

    return results;
  }
}

export const DEVICE_DISCOVERY_CLIENT = Symbol('DEVICE_DISCOVERY_CLIENT');
