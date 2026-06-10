import { networkInterfaces } from 'os';
import { Injectable } from '@nestjs/common';
import { MONITOR_NETWORK_CONFIG } from '@scandark/config';

export interface DetectedNetwork {
  network: string;
  cidr: number;
  source: 'environment' | 'auto-detected';
  interfaceName?: string;
}

@Injectable()
export class LocalNetworkDetector {
  detect(): DetectedNetwork {
    const fromEnv = MONITOR_NETWORK_CONFIG.DEFAULT_NETWORK;
    if (fromEnv && process.env.MONITOR_NETWORK) {
      return {
        network: fromEnv,
        cidr: MONITOR_NETWORK_CONFIG.DEFAULT_CIDR,
        source: 'environment',
      };
    }

    const detected = this.detectFromInterfaces();
    if (detected) return detected;

    return {
      network: MONITOR_NETWORK_CONFIG.DEFAULT_NETWORK,
      cidr: MONITOR_NETWORK_CONFIG.DEFAULT_CIDR,
      source: 'environment',
    };
  }

  private detectFromInterfaces(): DetectedNetwork | null {
    const interfaces = networkInterfaces();

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        if (addr.family !== 'IPv4' || addr.internal) continue;
        if (this.isDockerBridge(name, addr.address)) continue;

        const parts = addr.address.split('.').map(Number);
        return {
          network: `${parts[0]}.${parts[1]}.${parts[2]}.0`,
          cidr: this.maskToCidr(addr.netmask),
          source: 'auto-detected',
          interfaceName: name,
        };
      }
    }

    return null;
  }

  private isDockerBridge(name: string, ip: string): boolean {
    if (name.startsWith('docker') || name.startsWith('br-') || name === 'veth') return true;
    return ip.startsWith('172.17.') || ip.startsWith('172.18.');
  }

  private maskToCidr(mask: string): number {
    return mask
      .split('.')
      .map(Number)
      .map((octet) => octet.toString(2).padStart(8, '0'))
      .join('')
      .replace(/0+$/, '').length;
  }
}
