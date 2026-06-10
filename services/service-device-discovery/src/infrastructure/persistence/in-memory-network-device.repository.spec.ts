import { describe, it, expect, beforeEach } from 'vitest';
import { DeviceType } from '@scandark/shared-kernel';
import { NetworkDevice } from '../../domain/entities/network-device.entity';
import { InMemoryNetworkDeviceRepository } from './in-memory-network-device.repository';

const userId = 'user-1';

function createDevice(overrides: Partial<{
  ipAddress: string;
  macAddress: string;
  scanId: string;
}> = {}) {
  return NetworkDevice.create({
    userId,
    ipAddress: overrides.ipAddress ?? '192.168.1.10',
    macAddress: overrides.macAddress,
    hostname: 'host-a',
    deviceType: DeviceType.UNKNOWN,
    openPorts: [80],
    services: [],
    riskScore: 10,
    scanId: overrides.scanId ?? 'scan-1',
  });
}

describe('InMemoryNetworkDeviceRepository', () => {
  let repository: InMemoryNetworkDeviceRepository;

  beforeEach(() => {
    repository = new InMemoryNetworkDeviceRepository();
  });

  it('should not duplicate devices with the same IP on repeated scans', async () => {
    const first = createDevice({ scanId: 'scan-1' });
    const second = createDevice({ scanId: 'scan-2' });

    await repository.upsert(first);
    await repository.upsert(second);

    const all = await repository.findAllByUserId(userId);
    expect(all).toHaveLength(1);
    expect(all[0].scanId).toBe('scan-2');
  });

  it('should deduplicate by MAC address when available', async () => {
    const first = createDevice({ ipAddress: '192.168.1.10', macAddress: 'AA:BB:CC:DD:EE:FF' });
    const second = createDevice({ ipAddress: '192.168.1.50', macAddress: 'aa-bb-cc-dd-ee-ff' });

    await repository.upsert(first);
    await repository.upsert(second);

    const all = await repository.findAllByUserId(userId);
    expect(all).toHaveLength(1);
    expect(all[0].ipAddress).toBe('192.168.1.50');
  });

  it('should add a new device when identity differs', async () => {
    await repository.upsert(createDevice({ ipAddress: '192.168.1.10' }));
    await repository.upsert(createDevice({ ipAddress: '192.168.1.20' }));

    expect(await repository.findAllByUserId(userId)).toHaveLength(2);
  });

  it('should list devices only for the requested scan', async () => {
    await repository.upsert(createDevice({ ipAddress: '192.168.1.10', scanId: 'scan-a' }));
    await repository.upsert(createDevice({ ipAddress: '192.168.1.20', scanId: 'scan-b' }));

    const scanA = await repository.findByScanId('scan-a', userId);
    expect(scanA).toHaveLength(1);
    expect(scanA[0].ipAddress).toBe('192.168.1.10');
  });
});
