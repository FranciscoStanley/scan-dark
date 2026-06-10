import { DeviceType } from '@scandark/shared-kernel';
import { COMMON_PORTS, FIREWALL_LOG_CONFIG } from '@scandark/config';
import { ThreatEvent } from '../../domain/entities/threat-event.entity';
import { IIpIntelligenceProvider } from '../../domain/repositories/ip-intelligence.repository';
import { INetworkProbe } from '../../domain/repositories/network-probe.repository';
import { IThreatEventRepository } from '../../domain/repositories/threat-event.repository';
import { FirewallLogParser } from '../../domain/services/firewall-log.parser';
import {
  IntrusionDetectionEngine,
  NetworkEventInput,
} from '../../domain/services/intrusion-detection.engine';
import { IpIntelligence } from '../../domain/value-objects/ip-intelligence.vo';
import { DetectedNetwork, LocalNetworkDetector } from '../../infrastructure/network/local-network.detector';

export interface IngestFirewallInput {
  lines?: string[];
  events?: NetworkEventInput[];
}

export interface IngestionMetrics {
  linesProcessed: number;
  threatsCreated: number;
  lastIngestAt?: string;
  lastError?: string;
}

export interface EnrichedThreatEvent {
  event: ThreatEvent;
  sourceIpIntel: IpIntelligence;
}

export class LookupIpIntelligenceUseCase {
  constructor(private readonly ipIntel: IIpIntelligenceProvider) {}

  async execute(ip: string): Promise<IpIntelligence> {
    return this.ipIntel.lookup(ip);
  }
}

export class AnalyzeThreatUseCase {
  private readonly engine = new IntrusionDetectionEngine();

  constructor(
    private readonly ipIntel: IIpIntelligenceProvider,
    private readonly repository: IThreatEventRepository,
  ) {}

  async execute(input: NetworkEventInput): Promise<EnrichedThreatEvent[]> {
    const threats = this.engine.analyze(input);
    await this.repository.saveMany(threats);
    return this.enrichThreats(threats);
  }

  private async enrichThreats(threats: ThreatEvent[]): Promise<EnrichedThreatEvent[]> {
    const uniqueIps = [...new Set(threats.map((t) => t.sourceIp))];
    const intelMap = new Map<string, IpIntelligence>();

    await Promise.all(
      uniqueIps.map(async (ip) => {
        intelMap.set(ip, await this.ipIntel.lookup(ip));
      }),
    );

    return threats.map((event) => ({
      event,
      sourceIpIntel: intelMap.get(event.sourceIp)!,
    }));
  }
}

export class MonitorNetworkThreatsUseCase {
  private readonly engine = new IntrusionDetectionEngine();

  constructor(
    private readonly networkProbe: INetworkProbe,
    private readonly ipIntel: IIpIntelligenceProvider,
    private readonly repository: IThreatEventRepository,
  ) {}

  async execute(network: string, cidr = 24): Promise<EnrichedThreatEvent[]> {
    const findings = await this.networkProbe.probeNetwork(network, cidr);

    const events: NetworkEventInput[] = findings.map((finding) => ({
      sourceIp: finding.targetIp,
      targetIp: finding.targetIp,
      targetPort: finding.targetPort,
      protocol: finding.protocol,
      deviceType:
        finding.targetPort === 554 ? DeviceType.CAMERA : DeviceType.UNKNOWN,
      eventType: 'exposed_service',
    }));

    const threats = this.engine.analyzeNetworkFindings(events);
    await this.repository.saveMany(threats);

    const uniqueIps = [...new Set(threats.map((t) => t.sourceIp))];
    const intelMap = new Map<string, IpIntelligence>();
    await Promise.all(
      uniqueIps.map(async (ip) => {
        intelMap.set(ip, await this.ipIntel.lookup(ip));
      }),
    );

    return threats.map((event) => ({
      event,
      sourceIpIntel: intelMap.get(event.sourceIp)!,
    }));
  }
}

export class ListThreatsUseCase {
  constructor(private readonly repository: IThreatEventRepository) {}

  async execute(userId?: string): Promise<ThreatEvent[]> {
    return this.repository.findAll(userId);
  }
}

export class ResolveThreatUseCase {
  constructor(private readonly repository: IThreatEventRepository) {}

  async execute(id: string): Promise<ThreatEvent | undefined> {
    const event = await this.repository.findById(id);
    if (!event) return undefined;
    event.resolve();
    await this.repository.save(event);
    return event;
  }
}

export class GetNetworkDefaultsUseCase {
  constructor(private readonly detector: LocalNetworkDetector) {}

  execute(): DetectedNetwork {
    return this.detector.detect();
  }
}

export class IngestFirewallLogsUseCase {
  private readonly parser = new FirewallLogParser();
  private readonly recentEvents = new Set<string>();
  private metrics: IngestionMetrics = {
    linesProcessed: 0,
    threatsCreated: 0,
  };

  constructor(private readonly analyzeThreat: AnalyzeThreatUseCase) {}

  async execute(input: IngestFirewallInput): Promise<{
    parsed: number;
    threatsCreated: number;
    threats: EnrichedThreatEvent[];
  }> {
    const events = this.normalizeEvents(input);
    const allThreats: EnrichedThreatEvent[] = [];
    let parsed = 0;

    for (const event of events) {
      const dedupeKey = `${event.sourceIp}:${event.targetIp ?? ''}:${event.targetPort ?? ''}`;
      if (this.recentEvents.has(dedupeKey)) continue;
      this.recentEvents.add(dedupeKey);
      if (this.recentEvents.size > 5000) {
        this.recentEvents.clear();
      }

      parsed += 1;
      const threats = await this.analyzeThreat.execute(event);
      if (threats.length > 0) {
        allThreats.push(...threats);
        this.metrics.threatsCreated += threats.length;
      }
    }

    this.metrics.linesProcessed += parsed;
    this.metrics.lastIngestAt = new Date().toISOString();
    this.metrics.lastError = undefined;

    return {
      parsed,
      threatsCreated: allThreats.length,
      threats: allThreats,
    };
  }

  recordError(message: string): void {
    this.metrics.lastError = message;
  }

  getMetrics(): IngestionMetrics {
    return { ...this.metrics };
  }

  private normalizeEvents(input: IngestFirewallInput): NetworkEventInput[] {
    const fromLines =
      input.lines
        ?.map((line) => this.parser.parse(line))
        .filter((event): event is NonNullable<typeof event> => event !== null)
        .map((event) => this.toNetworkEvent(event)) ?? [];

    const fromEvents = (input.events ?? []).map((event) => ({
      ...event,
      eventType: event.eventType ?? 'firewall_block',
      deviceType: event.deviceType ?? this.deviceTypeFromPort(event.targetPort),
    }));

    return [...fromLines, ...fromEvents];
  }

  private toNetworkEvent(event: {
    sourceIp: string;
    targetIp?: string;
    targetPort?: number;
    protocol?: string;
    eventType?: string;
  }): NetworkEventInput {
    return {
      sourceIp: event.sourceIp,
      targetIp: event.targetIp,
      targetPort: event.targetPort,
      protocol: event.protocol,
      eventType: event.eventType ?? 'firewall_block',
      deviceType: this.deviceTypeFromPort(event.targetPort),
    };
  }

  private deviceTypeFromPort(port?: number): DeviceType | undefined {
    if (port === COMMON_PORTS.RTSP) return DeviceType.CAMERA;
    if (port === COMMON_PORTS.RDP) return DeviceType.COMPUTER;
    return undefined;
  }
}

export class GetIngestionStatusUseCase {
  constructor(
    private readonly ingestLogs: IngestFirewallLogsUseCase,
    private readonly logWatcher: { isWatching(): boolean },
  ) {}

  execute(): IngestionMetrics & {
    enabled: boolean;
    watching: boolean;
    logPath?: string;
    pollMs?: number;
  } {
    return {
      enabled: FIREWALL_LOG_CONFIG.ENABLED,
      watching: this.logWatcher.isWatching(),
      logPath: FIREWALL_LOG_CONFIG.PATH || undefined,
      pollMs: FIREWALL_LOG_CONFIG.POLL_MS,
      ...this.ingestLogs.getMetrics(),
    };
  }
}
