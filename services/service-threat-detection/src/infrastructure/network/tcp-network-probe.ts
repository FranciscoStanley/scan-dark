import * as net from 'net';
import { Injectable, Logger } from '@nestjs/common';
import { COMMON_PORTS } from '@scandark/config';
import { HostPortFinding, INetworkProbe } from '../../domain/repositories/network-probe.repository';

const ALIVE_CHECK_PORTS = [80, 443, 22, COMMON_PORTS.RTSP, COMMON_PORTS.RDP];
const THREAT_PORTS = [
  COMMON_PORTS.RTSP,
  COMMON_PORTS.RDP,
  COMMON_PORTS.SSH,
  COMMON_PORTS.TELNET,
  COMMON_PORTS.SMB,
];

@Injectable()
export class TcpNetworkProbe implements INetworkProbe {
  private readonly logger = new Logger(TcpNetworkProbe.name);
  private readonly connectTimeoutMs = 1500;
  private readonly maxHosts = 254;

  async probeNetwork(network: string, cidr: number): Promise<HostPortFinding[]> {
    const effectiveCidr = Math.max(cidr, 24);
    const hosts = this.generateIpRange(network, effectiveCidr).slice(0, this.maxHosts);
    const findings: HostPortFinding[] = [];

    this.logger.log(`Probing ${hosts.length} hosts on ${network}/${effectiveCidr}`);

    const batchSize = 40;
    for (let i = 0; i < hosts.length; i += batchSize) {
      const batch = hosts.slice(i, i + batchSize);
      const aliveHosts = (
        await Promise.all(batch.map(async (ip) => ((await this.isHostAlive(ip)) ? ip : null)))
      ).filter((ip): ip is string => ip !== null);

      for (const host of aliveHosts) {
        const openPorts = await this.scanThreatPorts(host);
        findings.push(...openPorts);
      }
    }

    this.logger.log(`Found ${findings.length} exposed threat ports`);
    return findings;
  }

  private async isHostAlive(host: string): Promise<boolean> {
    for (const port of ALIVE_CHECK_PORTS) {
      if (await this.isPortOpen(host, port)) return true;
    }
    return false;
  }

  private async scanThreatPorts(host: string): Promise<HostPortFinding[]> {
    const findings: HostPortFinding[] = [];

    for (const port of THREAT_PORTS) {
      const open = await this.isPortOpen(host, port);
      if (open) {
        findings.push({
          targetIp: host,
          targetPort: port,
          protocol: this.identifyProtocol(port),
          service: this.identifyService(port),
        });
      }
    }

    return findings;
  }

  private isPortOpen(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(this.connectTimeoutMs);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  private identifyService(port: number): string {
    const map: Record<number, string> = {
      [COMMON_PORTS.SSH]: 'ssh',
      [COMMON_PORTS.TELNET]: 'telnet',
      [COMMON_PORTS.SMB]: 'smb',
      [COMMON_PORTS.RTSP]: 'rtsp',
      [COMMON_PORTS.RDP]: 'rdp',
    };
    return map[port] ?? 'unknown';
  }

  private identifyProtocol(port: number): string {
    return this.identifyService(port);
  }

  private generateIpRange(network: string, cidr: number): string[] {
    const parts = network.split('.').map(Number);
    const hostBits = 32 - cidr;
    const totalHosts = Math.min(Math.pow(2, hostBits) - 2, this.maxHosts);

    const baseIp =
      ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
    const mask = (~0 << hostBits) >>> 0;
    const networkAddr = (baseIp & mask) >>> 0;

    const ips: string[] = [];
    for (let i = 1; i <= totalHosts; i++) {
      const ip = (networkAddr + i) >>> 0;
      ips.push(
        `${(ip >>> 24) & 255}.${(ip >>> 16) & 255}.${(ip >>> 8) & 255}.${ip & 255}`,
      );
    }
    return ips;
  }
}
