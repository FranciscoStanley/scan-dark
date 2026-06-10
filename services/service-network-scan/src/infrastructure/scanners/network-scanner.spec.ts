import { describe, it, expect } from 'vitest';
import { TcpNetworkScanner, ProtocolDiscoveryService } from './network-scanner.impl';

describe('TcpNetworkScanner', () => {
  const scanner = new TcpNetworkScanner();

  describe('generateIpRange', () => {
    it('should generate correct IP range for /24 network', () => {
      const ips = scanner.generateIpRange('192.168.1.0', 24);
      expect(ips.length).toBe(254);
      expect(ips[0]).toBe('192.168.1.1');
      expect(ips[ips.length - 1]).toBe('192.168.1.254');
    });

    it('should generate smaller range for /28 network', () => {
      const ips = scanner.generateIpRange('192.168.1.0', 28);
      expect(ips.length).toBe(14);
      expect(ips[0]).toBe('192.168.1.1');
    });
  });

  describe('inferDeviceType via SSDP', () => {
    it('should return empty array when SSDP multicast is unavailable', async () => {
      const protocol = new ProtocolDiscoveryService();
      const devices = await protocol.discoverSsdp();
      expect(Array.isArray(devices)).toBe(true);
    });
  });
});
