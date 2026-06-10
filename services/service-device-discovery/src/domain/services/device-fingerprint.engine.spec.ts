import { describe, it, expect } from 'vitest';
import { DeviceType } from '@scandark/shared-kernel';
import { DeviceFingerprintEngine } from './device-fingerprint.engine';

describe('DeviceFingerprintEngine', () => {
  const engine = new DeviceFingerprintEngine();

  it('should classify RTSP camera', () => {
    const result = engine.classify({
      ipAddress: '192.168.1.100',
      hostname: 'Hikvision IPC',
      openPorts: [80, 554],
    });
    expect(result.deviceType).toBe(DeviceType.CAMERA);
    expect(result.riskScore).toBeGreaterThan(0);
  });

  it('should classify smart TV', () => {
    const result = engine.classify({
      ipAddress: '192.168.1.50',
      hostname: 'Samsung TV Living Room',
      openPorts: [8080, 8008],
    });
    expect(result.deviceType).toBe(DeviceType.SMART_TV);
  });

  it('should classify router with admin panel', () => {
    const result = engine.classify({
      ipAddress: '192.168.1.1',
      hostname: 'TP-Link Router',
      openPorts: [80, 443],
    });
    expect(result.deviceType).toBe(DeviceType.ROUTER);
  });
});
