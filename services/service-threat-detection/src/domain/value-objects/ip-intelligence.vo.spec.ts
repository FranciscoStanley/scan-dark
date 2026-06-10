import { describe, it, expect } from 'vitest';
import { buildPrivateIpIntelligence, isPrivateIp } from './ip-intelligence.vo';

describe('ip-intelligence.vo', () => {
  it('should identify RFC 1918 private IPs', () => {
    expect(isPrivateIp('10.0.0.55')).toBe(true);
    expect(isPrivateIp('192.168.1.100')).toBe(true);
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('127.0.0.1')).toBe(true);
  });

  it('should identify public IPs', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('203.0.113.45')).toBe(false);
  });

  it('should build private IP intelligence metadata', () => {
    const intel = buildPrivateIpIntelligence('192.168.1.50');
    expect(intel.isPrivate).toBe(true);
    expect(intel.country).toBe('Rede Local');
    expect(intel.region).toContain('RFC 1918');
  });
});
