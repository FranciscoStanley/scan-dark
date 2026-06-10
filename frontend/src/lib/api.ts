const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LicenseStatus {
  isActive: boolean;
  licenseKey: string;
  organizationName: string;
  expiresAt: string;
  maxUsers: number;
  features: string[];
  daysRemaining: number;
}

export interface DiscoveredHost {
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  isAlive: boolean;
  responseTimeMs?: number;
  openPorts?: number[];
}

export interface ScanResults {
  hosts: DiscoveredHost[];
  totalHostsScanned: number;
  aliveHosts: number;
  durationMs: number;
}

export interface Scan {
  id: string;
  name: string;
  type: string;
  targetNetwork: string;
  status: string;
  progress: number;
  createdAt: string;
  completedAt?: string;
  results?: ScanResults;
}

export interface Device {
  id: string;
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  deviceType: string;
  vendor?: string;
  riskScore: number;
  openPorts: number[];
}

export interface Vulnerability {
  id: string;
  deviceId: string;
  title: string;
  description: string;
  severity: string;
  cveId?: string;
  remediation: string;
  detectedAt?: string;
}

export interface NetworkSummary {
  totalDevices: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  averageRiskScore: number;
}

export interface IpIntelligence {
  ip: string;
  isPrivate: boolean;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export interface ThreatEvent {
  id: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  sourceIp: string;
  targetIp?: string;
  targetPort?: number;
  deviceType?: string;
  remediation: string;
  detectedAt: string;
  sourceIpIntel?: IpIntelligence;
}

export interface ThreatStats {
  activeThreats: number;
  criticalThreats: number;
  resolvedToday: number;
  cameraIntrusions: number;
  remoteAccessAttempts: number;
  blockedAttempts: number;
}

export interface NetworkDefaults {
  network: string;
  cidr: number;
  source: 'environment' | 'auto-detected';
  interfaceName?: string;
}

export interface IngestionStatus {
  enabled: boolean;
  watching: boolean;
  logPath?: string;
  pollMs?: number;
  linesProcessed: number;
  threatsCreated: number;
  lastIngestAt?: string;
  lastError?: string;
}

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string | null, refresh?: string | null) {
    this.token = access;
    if (refresh !== undefined) this.refreshToken = refresh;
    if (typeof window !== 'undefined') {
      if (access) {
        localStorage.setItem('accessToken', access);
        if (refresh) localStorage.setItem('refreshToken', refresh);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') return localStorage.getItem('accessToken');
    return null;
  }

  private getRefreshToken(): string | null {
    if (this.refreshToken) return this.refreshToken;
    if (typeof window !== 'undefined') return localStorage.getItem('refreshToken');
    return null;
  }

  private async request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (response.status === 401 && retry && this.getRefreshToken()) {
      try {
        await this.refreshAccessToken();
        return this.request<T>(path, options, false);
      } catch {
        this.setTokens(null, null);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message ?? `HTTP ${response.status}`);
    }
    return response.json();
  }

  async refreshAccessToken(): Promise<AuthTokens> {
    const refresh = this.getRefreshToken();
    if (!refresh) throw new Error('No refresh token');

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!response.ok) throw new Error('Refresh failed');
    const tokens = (await response.json()) as AuthTokens;
    this.setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const tokens = await this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  async register(email: string, password: string, name: string): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  async getLicenseStatus(): Promise<LicenseStatus> {
    return this.request<LicenseStatus>('/auth/license/status');
  }

  async activateLicense(licenseKey: string): Promise<LicenseStatus> {
    return this.request<LicenseStatus>('/auth/license/activate', {
      method: 'POST',
      body: JSON.stringify({ licenseKey }),
    });
  }

  async createScan(data: { name: string; type: string; targetNetwork: string; cidr?: number }): Promise<Scan> {
    return this.request<Scan>('/scans', { method: 'POST', body: JSON.stringify(data) });
  }

  async listScans(): Promise<Scan[]> {
    return this.request<Scan[]>('/scans');
  }

  async getScan(id: string): Promise<Scan> {
    return this.request<Scan>(`/scans/${id}`);
  }

  async listDevices(): Promise<Device[]> {
    return this.request<Device[]>('/devices');
  }

  async listDevicesByScan(scanId: string): Promise<Device[]> {
    return this.request<Device[]>(`/devices/scan/${scanId}`);
  }

  async assessVulnerabilities(data: {
    deviceId: string;
    ipAddress: string;
    deviceType: string;
    openPorts: number[];
    scanId?: string;
  }): Promise<Vulnerability[]> {
    return this.request<Vulnerability[]>('/vulnerabilities/assess', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVulnerabilitiesByDevice(deviceId: string): Promise<Vulnerability[]> {
    return this.request<Vulnerability[]>(`/vulnerabilities/device/${deviceId}`);
  }

  async getVulnerabilitySummary(scanId: string): Promise<NetworkSummary> {
    return this.request<NetworkSummary>(`/vulnerabilities/summary/${scanId}`);
  }

  async getNetworkDefaults(): Promise<NetworkDefaults> {
    return this.request<NetworkDefaults>('/threats/network/defaults');
  }

  async getIngestionStatus(): Promise<IngestionStatus> {
    return this.request<IngestionStatus>('/threats/ingestion/status');
  }

  async monitorThreats(network: string, cidr = 24): Promise<ThreatEvent[]> {
    return this.request<ThreatEvent[]>('/threats/monitor', {
      method: 'POST',
      body: JSON.stringify({ network, cidr }),
    });
  }

  async listThreats(): Promise<ThreatEvent[]> {
    return this.request<ThreatEvent[]>('/threats');
  }

  async listActiveThreats(): Promise<ThreatEvent[]> {
    return this.request<ThreatEvent[]>('/threats/active');
  }

  async getThreatStats(): Promise<ThreatStats> {
    return this.request<ThreatStats>('/threats/stats');
  }

  async resolveThreat(id: string): Promise<ThreatEvent> {
    return this.request<ThreatEvent>(`/threats/${id}/resolve`, { method: 'PATCH' });
  }

  async lookupIpIntelligence(ip: string): Promise<IpIntelligence> {
    return this.request<IpIntelligence>(`/threats/ip/${ip}/intelligence`);
  }

  async healthCheck(): Promise<{ status: string; services: string[] }> {
    return this.request('/health');
  }
}

export const api = new ApiClient();
