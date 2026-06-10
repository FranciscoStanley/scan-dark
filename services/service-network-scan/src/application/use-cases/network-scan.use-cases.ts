import { Result, NotFoundError } from '@scandark/shared-kernel';
import { NetworkScan, ScanResults } from '../../domain/entities/network-scan.entity';
import {
  INetworkScanRepository,
  INetworkScanner,
  IProtocolDiscovery,
  IWifiAuditor,
  IRouterAuditor,
} from '../../domain/repositories/network-scan.repository';
import { ScanType } from '@scandark/shared-kernel';
import { IDeviceDiscoveryClient } from '../../infrastructure/clients/device-discovery.client';
import { IVulnerabilityClient } from '../../infrastructure/clients/vulnerability.client';

export interface CreateScanInput {
  name: string;
  type: ScanType;
  targetNetwork: string;
  cidr?: number;
  ports?: number[];
  userId: string;
}

export class CreateNetworkScanUseCase {
  constructor(
    private readonly repository: INetworkScanRepository,
    private readonly scanner: INetworkScanner,
    private readonly protocolDiscovery: IProtocolDiscovery,
    private readonly wifiAuditor: IWifiAuditor,
    private readonly routerAuditor: IRouterAuditor,
    private readonly deviceDiscovery: IDeviceDiscoveryClient,
    private readonly vulnerabilityClient: IVulnerabilityClient,
  ) {}

  async execute(input: CreateScanInput): Promise<Result<NetworkScan>> {
    const scan = NetworkScan.create({
      name: input.name,
      type: input.type,
      targetNetwork: input.targetNetwork,
      cidr: input.cidr ?? 24,
      ports: input.ports ?? [],
      userId: input.userId,
    });

    const saved = await this.repository.save(scan);
    this.runScanAsync(saved);
    return Result.ok(saved);
  }

  private runScanAsync(scan: NetworkScan): void {
    setImmediate(() => this.executeScan(scan.id));
  }

  private async executeScan(scanId: string): Promise<void> {
    const scan = await this.repository.findById(scanId);
    if (!scan) return;

    scan.start();
    await this.repository.save(scan);

    try {
      const startTime = Date.now();
      const totalIps = this.countHostsInRange(scan.targetNetwork, scan.cidr);

      scan.updateProgress(10);
      await this.repository.save(scan);

      let hosts = await this.scanner.discoverHosts(scan.targetNetwork, scan.cidr);

      scan.updateProgress(35);
      await this.repository.save(scan);

      if (
        scan.type === ScanType.NETWORK_DISCOVERY ||
        scan.type === ScanType.IOT_FINGERPRINT ||
        scan.type === ScanType.FULL_ASSESSMENT
      ) {
        const [mdns, ssdp, upnp] = await Promise.all([
          this.protocolDiscovery.discoverMdns(),
          this.protocolDiscovery.discoverSsdp(),
          this.protocolDiscovery.discoverUpnp(),
        ]);

        const protocolHosts = [...mdns, ...ssdp, ...upnp].map((d) => ({
          ipAddress: d.ipAddress,
          hostname: d.friendlyName,
          isAlive: true,
        }));

        const existingIps = new Set(hosts.map((h) => h.ipAddress));
        for (const ph of protocolHosts) {
          if (!existingIps.has(ph.ipAddress)) {
            hosts.push(ph);
            existingIps.add(ph.ipAddress);
          }
        }
      }

      scan.updateProgress(55);
      await this.repository.save(scan);

      const shouldPortScan =
        scan.type === ScanType.PORT_SCAN ||
        scan.type === ScanType.FULL_ASSESSMENT ||
        scan.type === ScanType.NETWORK_DISCOVERY ||
        scan.type === ScanType.IOT_FINGERPRINT ||
        scan.ports.length > 0;

      if (shouldPortScan && hosts.length > 0) {
        hosts = await this.scanner.enrichHosts(hosts, scan.ports);
      }

      scan.updateProgress(75);
      await this.repository.save(scan);

      if (scan.type === ScanType.WIFI_AUDIT || scan.type === ScanType.FULL_ASSESSMENT) {
        await this.wifiAuditor.audit();
      }

      if (scan.type === ScanType.ROUTER_AUDIT || scan.type === ScanType.FULL_ASSESSMENT) {
        const gatewayIp = scan.targetNetwork.replace(/\.\d+$/, '.1');
        await this.routerAuditor.audit(gatewayIp);
      }

      const fingerprinted = await this.deviceDiscovery.fingerprintHosts(
        hosts,
        scanId,
        scan.userId,
      );

      if (
        scan.type === ScanType.FULL_ASSESSMENT ||
        scan.type === ScanType.IOT_FINGERPRINT
      ) {
        for (const device of fingerprinted) {
          await this.vulnerabilityClient.assessDevice(scan.userId, {
            id: device.id,
            ipAddress: device.ipAddress,
            deviceType: device.deviceType,
            openPorts: device.openPorts,
            scanId,
          });
        }
      }

      const results: ScanResults = {
        hosts,
        totalHostsScanned: totalIps,
        aliveHosts: hosts.filter((h) => h.isAlive).length,
        durationMs: Date.now() - startTime,
      };

      scan.complete(results);
      await this.repository.save(scan);
    } catch (error) {
      scan.fail(error instanceof Error ? error.message : 'Unknown scan error');
      await this.repository.save(scan);
    }
  }

  private countHostsInRange(network: string, cidr: number): number {
    const hostBits = 32 - cidr;
    return Math.min(Math.pow(2, hostBits) - 2, 254);
  }
}

export class GetNetworkScanUseCase {
  constructor(private readonly repository: INetworkScanRepository) {}

  async execute(id: string): Promise<Result<NetworkScan>> {
    const scan = await this.repository.findById(id);
    if (!scan) return Result.fail(new NotFoundError('Scan', id));
    return Result.ok(scan);
  }
}

export class ListNetworkScansUseCase {
  constructor(private readonly repository: INetworkScanRepository) {}

  async execute(userId: string): Promise<NetworkScan[]> {
    return this.repository.findByUserId(userId);
  }
}
