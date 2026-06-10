import { describe, it, expect, vi } from 'vitest';
import { DeviceType } from '@scandark/shared-kernel';
import { COMMON_PORTS } from '@scandark/config';
import {
  AnalyzeThreatUseCase,
  IngestFirewallLogsUseCase,
  MonitorNetworkThreatsUseCase,
} from './threat-detection.use-cases';
import { InMemoryThreatEventRepository } from '../../infrastructure/persistence/in-memory-threat-event.repository';
import { IIpIntelligenceProvider } from '../../domain/repositories/ip-intelligence.repository';
import { INetworkProbe } from '../../domain/repositories/network-probe.repository';
import { buildPrivateIpIntelligence } from '../../domain/value-objects/ip-intelligence.vo';

const ipIntelMock: IIpIntelligenceProvider = {
  lookup: vi.fn(async (ip: string) => buildPrivateIpIntelligence(ip)),
};

describe('Threat detection use cases', () => {
  it('should enrich analyzed threats with IP intelligence', async () => {
    const repo = new InMemoryThreatEventRepository();
    const useCase = new AnalyzeThreatUseCase(ipIntelMock, repo);

    const result = await useCase.execute({
      sourceIp: '203.0.113.45',
      targetIp: '192.168.1.100',
      targetPort: COMMON_PORTS.RTSP,
      deviceType: DeviceType.CAMERA,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.sourceIpIntel.ip).toBe('203.0.113.45');
    expect((await repo.findAll()).length).toBeGreaterThan(0);
  });

  it('should monitor network using real probe findings', async () => {
    const repo = new InMemoryThreatEventRepository();
    const probeMock: INetworkProbe = {
      probeNetwork: vi.fn(async () => [
        {
          targetIp: '192.168.1.50',
          targetPort: COMMON_PORTS.RDP,
          protocol: 'rdp',
          service: 'rdp',
        },
      ]),
    };

    const useCase = new MonitorNetworkThreatsUseCase(probeMock, ipIntelMock, repo);
    const result = await useCase.execute('192.168.1.0', 24);

    expect(probeMock.probeNetwork).toHaveBeenCalledWith('192.168.1.0', 24);
    expect(result.some((item) => item.event.title.includes('RDP'))).toBe(true);
  });

  it('should ingest firewall log lines and create external threats', async () => {
    const repo = new InMemoryThreatEventRepository();
    const analyze = new AnalyzeThreatUseCase(ipIntelMock, repo);
    const ingest = new IngestFirewallLogsUseCase(analyze);

    const result = await ingest.execute({
      lines: ['IN=wan SRC=203.0.113.45 DST=192.168.1.100 PROTO=TCP DPT=554'],
    });

    expect(result.parsed).toBe(1);
    expect(result.threatsCreated).toBeGreaterThan(0);
    expect(result.threats[0]?.sourceIpIntel.ip).toBe('203.0.113.45');
  });
});
