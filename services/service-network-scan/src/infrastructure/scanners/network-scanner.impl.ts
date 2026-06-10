import * as net from 'net';
import * as dgram from 'dgram';
import * as dns from 'dns';
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import { Injectable, Logger } from '@nestjs/common';
import { COMMON_PORTS } from '@scandark/config';
import {
  INetworkScanner,
  ProtocolDevice,
  IProtocolDiscovery,
  IWifiAuditor,
  IRouterAuditor,
  WifiAuditResult,
  RouterAuditResult,
} from '../../domain/repositories/network-scan.repository';
import { DiscoveredHost, OpenPort } from '../../domain/entities/network-scan.entity';

const execAsync = promisify(exec);
const dnsReverse = promisify(dns.reverse);

const PROBE_PORTS = [
  COMMON_PORTS.HTTP,
  COMMON_PORTS.HTTPS,
  COMMON_PORTS.SSH,
  COMMON_PORTS.SMB,
  8080,
  8000,
  8443,
  37777,
  34567,
  COMMON_PORTS.RTSP,
  COMMON_PORTS.RDP,
  COMMON_PORTS.MQTT,
  COMMON_PORTS.UPNP,
  5353,
];

const SCAN_PORTS = Object.values(COMMON_PORTS);

@Injectable()
export class TcpNetworkScanner implements INetworkScanner {
  private readonly logger = new Logger(TcpNetworkScanner.name);
  private readonly connectTimeoutMs = 1500;

  async discoverHosts(network: string, cidr: number): Promise<DiscoveredHost[]> {
    const hosts = this.generateIpRange(network, cidr);
    const results: DiscoveredHost[] = [];

    const batchSize = 30;
    for (let i = 0; i < hosts.length; i += batchSize) {
      const batch = hosts.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((ip) => this.checkHost(ip)));
      results.push(...batchResults.filter((h) => h.isAlive));
      this.logger.debug(`Batch ${Math.floor(i / batchSize) + 1}: ${results.length} hosts alive`);
    }

    return results;
  }

  async scanPorts(host: string, ports: number[]): Promise<OpenPort[]> {
    const scanPorts = ports.length > 0 ? ports : SCAN_PORTS;
    const results = await Promise.all(scanPorts.map((port) => this.probePort(host, port)));
    return results.filter((p) => p.state === 'open');
  }

  async enrichHosts(hosts: DiscoveredHost[], ports: number[]): Promise<DiscoveredHost[]> {
    const enriched: DiscoveredHost[] = [];

    for (const host of hosts) {
      if (!host.isAlive) {
        enriched.push(host);
        continue;
      }

      const openPorts = await this.scanPorts(host.ipAddress, ports);
      const hostname = host.hostname ?? (await this.resolveHostname(host.ipAddress));

      enriched.push({
        ...host,
        hostname,
        openPorts: openPorts.map((p) => p.port),
      });
    }

    return enriched;
  }

  private async checkHost(ip: string): Promise<DiscoveredHost> {
    const start = Date.now();

    const [pingAlive, tcpChecks] = await Promise.all([
      this.pingHost(ip),
      Promise.all(PROBE_PORTS.map(async (port) => ({ port, open: await this.isPortOpen(ip, port) }))),
    ]);

    const openPorts = tcpChecks.filter((c) => c.open).map((c) => c.port);

    if (pingAlive || openPorts.length > 0) {
      return {
        ipAddress: ip,
        isAlive: true,
        responseTimeMs: Date.now() - start,
        openPorts: openPorts.length > 0 ? openPorts : undefined,
      };
    }

    return { ipAddress: ip, isAlive: false };
  }

  private async pingHost(ip: string): Promise<boolean> {
    const isWindows = platform() === 'win32';
    const command = isWindows
      ? `ping -n 1 -w 1000 ${ip}`
      : `ping -c 1 -W 1 ${ip}`;

    try {
      const { stdout } = await execAsync(command, { timeout: 3000 });
      const output = stdout.toLowerCase();
      if (isWindows) {
        return output.includes('ttl=') || output.includes('bytes=');
      }
      return output.includes('1 received') || output.includes('1 packets received');
    } catch {
      return false;
    }
  }

  private async resolveHostname(ip: string): Promise<string | undefined> {
    try {
      const names = await dnsReverse(ip);
      return names[0];
    } catch {
      return undefined;
    }
  }

  private async probePort(host: string, port: number): Promise<OpenPort> {
    const open = await this.isPortOpen(host, port);
    const service = this.identifyService(port);

    return {
      port,
      protocol: 'tcp',
      service,
      state: open ? 'open' : 'closed',
    };
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
    const serviceMap: Record<number, string> = {
      21: 'ftp',
      22: 'ssh',
      23: 'telnet',
      25: 'smtp',
      53: 'dns',
      80: 'http',
      443: 'https',
      445: 'smb',
      554: 'rtsp',
      161: 'snmp',
      1883: 'mqtt',
      1900: 'upnp',
      3389: 'rdp',
      5683: 'coap',
      8080: 'http-proxy',
    };
    return serviceMap[port] ?? 'unknown';
  }

  generateIpRange(network: string, cidr: number): string[] {
    const parts = network.split('.').map(Number);
    const hostBits = 32 - cidr;
    const totalHosts = Math.min(Math.pow(2, hostBits) - 2, 254);

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

@Injectable()
export class ProtocolDiscoveryService implements IProtocolDiscovery {
  private readonly logger = new Logger(ProtocolDiscoveryService.name);
  private readonly ssdpTimeoutMs = 4000;

  async discoverMdns(): Promise<ProtocolDevice[]> {
    this.logger.log('mDNS discovery not available without multicast bind — skipping');
    return [];
  }

  async discoverSsdp(): Promise<ProtocolDevice[]> {
    this.logger.log('Starting real SSDP/UPnP discovery...');
    return this.discoverSsdpDevices();
  }

  async discoverUpnp(): Promise<ProtocolDevice[]> {
    return this.discoverSsdp();
  }

  private discoverSsdpDevices(): Promise<ProtocolDevice[]> {
    return new Promise((resolve) => {
      const devices: ProtocolDevice[] = [];
      const seenIps = new Set<string>();

      const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

      const finish = () => {
        socket.close();
        this.logger.log(`SSDP discovery found ${devices.length} devices`);
        resolve(devices);
      };

      const timeout = setTimeout(finish, this.ssdpTimeoutMs);

      socket.on('message', (msg) => {
        const text = msg.toString();
        const location = this.extractHeader(text, 'LOCATION');
        const server = this.extractHeader(text, 'SERVER');
        const st = this.extractHeader(text, 'ST');

        if (!location) return;

        const ip = this.extractIpFromUrl(location);
        if (!ip || seenIps.has(ip)) return;
        seenIps.add(ip);

        devices.push({
          ipAddress: ip,
          protocol: 'ssdp',
          deviceType: this.inferDeviceType(st, server),
          friendlyName: server ?? st,
          manufacturer: server?.split('/')[0]?.trim(),
        });
      });

      socket.on('error', (err) => {
        this.logger.warn(`SSDP socket error: ${err.message}`);
        clearTimeout(timeout);
        finish();
      });

      const message = Buffer.from(
        'M-SEARCH * HTTP/1.1\r\n' +
          'HOST: 239.255.255.250:1900\r\n' +
          'MAN: "ssdp:discover"\r\n' +
          'MX: 2\r\n' +
          'ST: ssdp:all\r\n' +
          '\r\n',
      );

      socket.bind(() => {
        try {
          socket.setBroadcast(true);
          socket.send(message, 0, message.length, 1900, '239.255.255.250');
        } catch (err) {
          this.logger.warn(`SSDP send failed: ${err instanceof Error ? err.message : 'unknown'}`);
          clearTimeout(timeout);
          finish();
        }
      });
    });
  }

  private extractHeader(response: string, header: string): string | undefined {
    const match = response.match(new RegExp(`^${header}:\\s*(.+)$`, 'im'));
    return match?.[1]?.trim();
  }

  private extractIpFromUrl(url: string): string | undefined {
    const match = url.match(/https?:\/\/(\d{1,3}(?:\.\d{1,3}){3})/);
    return match?.[1];
  }

  private inferDeviceType(st?: string, server?: string): string {
    const text = `${st ?? ''} ${server ?? ''}`.toLowerCase();
    if (text.includes('mediaserver') || text.includes('tv') || text.includes('roku')) return 'smart_tv';
    if (text.includes('router') || text.includes('gateway') || text.includes('upnp:rootdevice')) return 'router';
    if (text.includes('printer')) return 'printer';
    if (text.includes('nas') || text.includes('synology') || text.includes('qnap')) return 'nas';
    if (text.includes('playstation') || text.includes('xbox')) return 'gaming';
    return 'iot';
  }
}

@Injectable()
export class WifiAuditorService implements IWifiAuditor {
  async audit(): Promise<WifiAuditResult> {
    return {
      encryption: 'unavailable',
      vulnerabilities: [
        {
          title: 'Auditoria WiFi requer ferramentas do sistema operacional',
          severity: 'info',
          description:
            'A auditoria WiFi completa requer acesso à interface wireless do host (iwconfig, netsh wlan). Execute o ScanDark diretamente na máquina conectada à rede.',
          remediation: 'Execute o serviço em modo host network ou instale ferramentas WiFi no sistema.',
        },
      ],
    };
  }
}

@Injectable()
export class RouterAuditorService implements IRouterAuditor {
  async audit(gatewayIp: string): Promise<RouterAuditResult> {
    const adminExposed = await this.checkAdminPanel(gatewayIp);
    const upnpOpen = await this.checkPort(gatewayIp, COMMON_PORTS.UPNP);

    return {
      gatewayIp,
      adminPanelExposed: adminExposed,
      defaultCredentialsRisk: adminExposed,
      upnpEnabled: upnpOpen,
      remoteAccessEnabled: false,
      vulnerabilities: [
        ...(adminExposed
          ? [
              {
                title: 'Painel administrativo acessível na rede',
                severity: 'high',
                description: `Interface web do roteador (${gatewayIp}) está acessível na LAN.`,
                remediation: 'Restrinja acesso ao painel admin por MAC/IP ou desabilite acesso remoto.',
              },
            ]
          : []),
        ...(upnpOpen
          ? [
              {
                title: 'UPnP habilitado',
                severity: 'medium',
                description: 'UPnP permite que dispositivos abram portas automaticamente no roteador.',
                remediation: 'Desabilite UPnP se não for estritamente necessário.',
              },
            ]
          : []),
      ],
    };
  }

  private async checkAdminPanel(gatewayIp: string): Promise<boolean> {
    return this.checkPort(gatewayIp, COMMON_PORTS.HTTP) || this.checkPort(gatewayIp, COMMON_PORTS.HTTPS);
  }

  private checkPort(gatewayIp: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => resolve(false));
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, gatewayIp);
    });
  }
}
