import { NetworkScan } from '../entities/network-scan.entity';

export interface INetworkScanRepository {
  findById(id: string): Promise<NetworkScan | null>;
  findByUserId(userId: string): Promise<NetworkScan[]>;
  save(scan: NetworkScan): Promise<NetworkScan>;
}

export const NETWORK_SCAN_REPOSITORY = Symbol('NETWORK_SCAN_REPOSITORY');

export interface INetworkScanner {
  discoverHosts(network: string, cidr: number): Promise<import('../entities/network-scan.entity').DiscoveredHost[]>;
  scanPorts(host: string, ports: number[]): Promise<import('../entities/network-scan.entity').OpenPort[]>;
  enrichHosts(
    hosts: import('../entities/network-scan.entity').DiscoveredHost[],
    ports: number[],
  ): Promise<import('../entities/network-scan.entity').DiscoveredHost[]>;
}

export const NETWORK_SCANNER = Symbol('NETWORK_SCANNER');

export interface IProtocolDiscovery {
  discoverMdns(): Promise<ProtocolDevice[]>;
  discoverSsdp(): Promise<ProtocolDevice[]>;
  discoverUpnp(): Promise<ProtocolDevice[]>;
}

export interface ProtocolDevice {
  ipAddress: string;
  protocol: string;
  deviceType: string;
  friendlyName?: string;
  manufacturer?: string;
  model?: string;
}

export const PROTOCOL_DISCOVERY = Symbol('PROTOCOL_DISCOVERY');

export interface IWifiAuditor {
  audit(): Promise<WifiAuditResult>;
}

export interface WifiAuditResult {
  ssid?: string;
  encryption: string;
  channel?: number;
  signalStrength?: number;
  vulnerabilities: WifiVulnerability[];
}

export interface WifiVulnerability {
  title: string;
  severity: string;
  description: string;
  remediation: string;
}

export const WIFI_AUDITOR = Symbol('WIFI_AUDITOR');

export interface IRouterAuditor {
  audit(gatewayIp: string): Promise<RouterAuditResult>;
}

export interface RouterAuditResult {
  gatewayIp: string;
  adminPanelExposed: boolean;
  defaultCredentialsRisk: boolean;
  upnpEnabled: boolean;
  remoteAccessEnabled: boolean;
  firmwareVersion?: string;
  vulnerabilities: RouterVulnerability[];
}

export interface RouterVulnerability {
  title: string;
  severity: string;
  description: string;
  remediation: string;
}

export const ROUTER_AUDITOR = Symbol('ROUTER_AUDITOR');
