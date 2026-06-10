import { describe, it, expect } from 'vitest';
import { DeviceType } from '@scandark/shared-kernel';
import { COMMON_PORTS } from '@scandark/config';
import { IntrusionDetectionEngine } from './intrusion-detection.engine';

describe('IntrusionDetectionEngine', () => {
  const engine = new IntrusionDetectionEngine();

  it('should detect external camera RTSP access', () => {
    const threats = engine.analyze({
      sourceIp: '203.0.113.45',
      targetIp: '192.168.1.100',
      targetPort: COMMON_PORTS.RTSP,
      deviceType: DeviceType.CAMERA,
      isExternal: true,
    });
    expect(threats.length).toBeGreaterThan(0);
    expect(threats[0]?.title).toContain('câmera');
  });

  it('should detect SSH brute force', () => {
    const threats = engine.analyze({
      sourceIp: '192.168.1.50',
      targetIp: '192.168.1.1',
      targetPort: COMMON_PORTS.SSH,
      eventType: 'ssh_brute_force',
      failedAttempts: 10,
    });
    expect(threats.some((t) => t.type.includes('ssh'))).toBe(true);
  });

  it('should detect RDP intrusion from external IP', () => {
    const threats = engine.analyze({
      sourceIp: '198.51.100.22',
      targetIp: '192.168.1.50',
      targetPort: COMMON_PORTS.RDP,
      isExternal: true,
      failedAttempts: 5,
    });
    expect(threats.length).toBeGreaterThan(0);
  });

  it('should detect exposed RTSP from real network scan', () => {
    const threats = engine.analyze({
      sourceIp: '192.168.1.100',
      targetIp: '192.168.1.100',
      targetPort: COMMON_PORTS.RTSP,
      deviceType: DeviceType.CAMERA,
      eventType: 'exposed_service',
    });
    expect(threats.some((t) => t.title.includes('RTSP'))).toBe(true);
  });

  it('should auto-detect external source IPs', () => {
    const threats = engine.analyze({
      sourceIp: '203.0.113.45',
      targetIp: '192.168.1.100',
      targetPort: COMMON_PORTS.RTSP,
      deviceType: DeviceType.CAMERA,
    });
    expect(threats.some((t) => t.title.includes('externo'))).toBe(true);
  });
});
