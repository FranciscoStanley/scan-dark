import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryNetworkDeviceRepository } from '../../infrastructure/persistence/in-memory-network-device.repository';
import {
  FingerprintDeviceUseCase,
  ListDevicesUseCase,
} from './device-discovery.use-cases';

describe('Device discovery use cases', () => {
  let repository: InMemoryNetworkDeviceRepository;
  let fingerprintDevice: FingerprintDeviceUseCase;
  let listDevices: ListDevicesUseCase;
  const userId = 'user-1';

  beforeEach(() => {
    repository = new InMemoryNetworkDeviceRepository();
    fingerprintDevice = new FingerprintDeviceUseCase(repository);
    listDevices = new ListDevicesUseCase(repository);
  });

  it('should keep inventory size stable when fingerprinting the same host twice', async () => {
    const input = {
      userId,
      ipAddress: '192.168.1.100',
      hostname: 'camera-01',
      openPorts: [554, 80],
      scanId: 'scan-1',
    };

    await fingerprintDevice.execute(input);
    await fingerprintDevice.execute({ ...input, scanId: 'scan-2' });

    const devices = await listDevices.execute(userId);
    expect(devices).toHaveLength(1);
  });
});
