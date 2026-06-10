import { DeviceType } from '@scandark/shared-kernel';
import { IOT_SIGNATURES, COMMON_PORTS } from '@scandark/config';
import { DeviceService } from '../entities/network-device.entity';

export interface FingerprintInput {
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  openPorts: number[];
  banners?: Record<number, string>;
}

export class DeviceFingerprintEngine {
  classify(input: FingerprintInput): {
    deviceType: DeviceType;
    vendor?: string;
    os?: string;
    services: DeviceService[];
    riskScore: number;
  } {
    const services = this.mapServices(input.openPorts, input.banners);
    const deviceType = this.detectDeviceType(input, services);
    const vendor = this.detectVendor(input, services);
    const os = this.detectOs(services);
    const riskScore = this.calculateRiskScore(input.openPorts, deviceType, services);

    return { deviceType, vendor, os, services, riskScore };
  }

  private detectDeviceType(input: FingerprintInput, services: DeviceService[]): DeviceType {
    const searchText = [
      input.hostname ?? '',
      input.macAddress ?? '',
      ...services.map((s) => `${s.name} ${s.banner ?? ''}`),
    ]
      .join(' ')
      .toLowerCase();

    if (searchText.includes('router') || searchText.includes('gateway')) {
      return DeviceType.ROUTER;
    }
    if (input.openPorts.includes(COMMON_PORTS.RTSP) || this.matchesSignature(searchText, IOT_SIGNATURES.CAMERA)) {
      return DeviceType.CAMERA;
    }
    if (this.matchesSignature(searchText, IOT_SIGNATURES.SMART_TV)) {
      return DeviceType.SMART_TV;
    }
    if (this.matchesSignature(searchText, IOT_SIGNATURES.ROUTER)) {
      return DeviceType.ROUTER;
    }
    if (this.matchesSignature(searchText, IOT_SIGNATURES.SPEAKER)) {
      return DeviceType.SPEAKER;
    }
    if (this.matchesSignature(searchText, IOT_SIGNATURES.NAS)) {
      return DeviceType.NAS;
    }
    if (input.openPorts.includes(COMMON_PORTS.RDP) || input.openPorts.includes(COMMON_PORTS.SSH)) {
      return DeviceType.COMPUTER;
    }
    if (input.openPorts.includes(COMMON_PORTS.MQTT) || input.openPorts.includes(COMMON_PORTS.COAP)) {
      return DeviceType.IOT;
    }
    if (services.some((s) => s.name === 'http' && input.openPorts.includes(8080))) {
      return DeviceType.MOBILE;
    }

    return DeviceType.UNKNOWN;
  }

  private detectVendor(input: FingerprintInput, services: DeviceService[]): string | undefined {
    if (input.macAddress) {
      const prefix = input.macAddress.substring(0, 8).toUpperCase();
      const ouiMap: Record<string, string> = {
        '00:1A:2B': 'Cisco',
        'B8:27:EB': 'Raspberry Pi',
        'DC:A6:32': 'Raspberry Pi',
        '00:17:88': 'Philips',
        '44:65:0D': 'Amazon',
        '18:B4:30': 'Google',
      };
      for (const [oui, vendor] of Object.entries(ouiMap)) {
        if (prefix.startsWith(oui)) return vendor;
      }
    }

    const banner = services.find((s) => s.banner)?.banner?.toLowerCase() ?? '';
    for (const signatures of Object.values(IOT_SIGNATURES)) {
      for (const sig of signatures) {
        if (banner.includes(sig)) return sig.charAt(0).toUpperCase() + sig.slice(1);
      }
    }
    return undefined;
  }

  private detectOs(services: DeviceService[]): string | undefined {
    for (const service of services) {
      const banner = service.banner?.toLowerCase() ?? '';
      if (banner.includes('ubuntu')) return 'Ubuntu Linux';
      if (banner.includes('windows')) return 'Windows';
      if (banner.includes('android')) return 'Android';
      if (banner.includes('darwin') || banner.includes('macos')) return 'macOS';
      if (banner.includes('openwrt')) return 'OpenWrt';
    }
    return undefined;
  }

  private calculateRiskScore(
    openPorts: number[],
    deviceType: DeviceType,
    services: DeviceService[],
  ): number {
    let score = 0;

    const criticalPorts = [COMMON_PORTS.TELNET, COMMON_PORTS.FTP, COMMON_PORTS.RDP];
    for (const port of openPorts) {
      if (criticalPorts.includes(port as (typeof criticalPorts)[number])) score += 25;
      if (port === COMMON_PORTS.RTSP) score += 15;
      if (port === COMMON_PORTS.UPNP) score += 10;
    }

    if (deviceType === DeviceType.CAMERA && openPorts.includes(COMMON_PORTS.RTSP)) score += 20;
    if (deviceType === DeviceType.ROUTER && openPorts.includes(COMMON_PORTS.HTTP)) score += 15;
    if (services.some((s) => s.name === 'telnet')) score += 30;

    return Math.min(100, score);
  }

  private mapServices(
    ports: number[],
    banners?: Record<number, string>,
  ): DeviceService[] {
    const portNames: Record<number, string> = {
      21: 'ftp', 22: 'ssh', 23: 'telnet', 80: 'http', 443: 'https',
      445: 'smb', 554: 'rtsp', 1883: 'mqtt', 3389: 'rdp', 8080: 'http-proxy',
    };
    return ports.map((port) => ({
      port,
      name: portNames[port] ?? 'unknown',
      banner: banners?.[port],
    }));
  }

  private matchesSignature(text: string, signatures: readonly string[]): boolean {
    return signatures.some((sig) => text.includes(sig));
  }
}
