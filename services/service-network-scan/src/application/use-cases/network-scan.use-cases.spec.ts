import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanType, ScanStatus, Result } from '@scandark/shared-kernel';
import { CreateNetworkScanUseCase } from './network-scan.use-cases';
import { DiscoveredHost, NetworkScan } from '../../domain/entities/network-scan.entity';

describe('CreateNetworkScanUseCase', () => {
  const mockRepo = {
    save: vi.fn(async (scan: NetworkScan) => scan),
    findById: vi.fn(),
  };

  const mockScanner = {
    discoverHosts: vi.fn(async () => [
      { ipAddress: '192.168.1.1', isAlive: true },
      { ipAddress: '192.168.1.50', isAlive: true },
    ]),
    scanPorts: vi.fn(async () => [{ port: 80, protocol: 'tcp' as const, state: 'open' as const }]),
    enrichHosts: vi.fn(async (hosts: DiscoveredHost[]) =>
      hosts.map((h) => ({ ...h, openPorts: [80], hostname: 'router.local' })),
    ),
  };

  const mockProtocol = {
    discoverMdns: vi.fn(async () => []),
    discoverSsdp: vi.fn(async () => []),
    discoverUpnp: vi.fn(async () => []),
  };

  const mockWifi = { audit: vi.fn(async () => ({ encryption: 'WPA2', vulnerabilities: [] })) };
  const mockRouter = {
    audit: vi.fn(async () => ({
      gatewayIp: '192.168.1.1',
      adminPanelExposed: true,
      defaultCredentialsRisk: true,
      upnpEnabled: false,
      remoteAccessEnabled: false,
      vulnerabilities: [],
    })),
  };

  const mockDeviceDiscovery = {
    fingerprintHosts: vi.fn(async () => []),
  };

  const mockVulnerability = {
    assessDevice: vi.fn(async () => []),
  };

  let useCase: CreateNetworkScanUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateNetworkScanUseCase(
      mockRepo as never,
      mockScanner as never,
      mockProtocol as never,
      mockWifi as never,
      mockRouter as never,
      mockDeviceDiscovery as never,
      mockVulnerability as never,
    );
  });

  it('should create scan and run discovery with fingerprint', async () => {
    let savedScan: NetworkScan | undefined;
    mockRepo.save.mockImplementation(async (scan: NetworkScan) => {
      savedScan = scan;
      return scan;
    });
    mockRepo.findById.mockImplementation(async () => savedScan);

    const result = await useCase.execute({
      name: 'Test Scan',
      type: ScanType.NETWORK_DISCOVERY,
      targetNetwork: '192.168.1.0',
      cidr: 24,
      userId: 'user-1',
    });

    expect(Result.isOk(result)).toBe(true);
    expect(mockRepo.save).toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 100));

    expect(mockScanner.discoverHosts).toHaveBeenCalledWith('192.168.1.0', 24);
    expect(mockScanner.enrichHosts).toHaveBeenCalled();
    expect(mockDeviceDiscovery.fingerprintHosts).toHaveBeenCalled();
    expect(savedScan?.status).toBe(ScanStatus.COMPLETED);
    expect(savedScan?.results?.aliveHosts).toBe(2);
  });
});
