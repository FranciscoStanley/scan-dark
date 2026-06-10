import { COMMON_PORTS } from '@scandark/config';

export interface ParsedFirewallEvent {
  sourceIp: string;
  targetIp?: string;
  targetPort?: number;
  protocol?: string;
  eventType?: string;
  rawLine: string;
}

const PORT_PROTOCOL: Record<number, string> = {
  [COMMON_PORTS.RTSP]: 'rtsp',
  [COMMON_PORTS.RDP]: 'rdp',
  [COMMON_PORTS.SSH]: 'ssh',
  [COMMON_PORTS.TELNET]: 'telnet',
  [COMMON_PORTS.SMB]: 'smb',
};

export class FirewallLogParser {
  parse(line: string): ParsedFirewallEvent | null {
    const trimmed = line.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) return null;

    if (trimmed.startsWith('{')) {
      return this.parseJson(trimmed);
    }

    return this.parseKeyValue(trimmed);
  }

  private parseJson(line: string): ParsedFirewallEvent | null {
    try {
      const data = JSON.parse(line) as Record<string, unknown>;
      const sourceIp = this.pickString(data, ['sourceIp', 'src', 'src_ip', 'source']);
      if (!sourceIp || !this.isIpv4(sourceIp)) return null;

      const targetIp = this.pickString(data, ['targetIp', 'dst', 'dst_ip', 'destination']);
      const targetPort = this.pickNumber(data, ['targetPort', 'dpt', 'dst_port', 'port']);
      const protocol = this.pickString(data, ['protocol', 'proto']) ?? this.protocolFromPort(targetPort);

      return {
        sourceIp,
        targetIp: targetIp && this.isIpv4(targetIp) ? targetIp : undefined,
        targetPort,
        protocol,
        eventType: this.pickString(data, ['eventType', 'action']) ?? 'firewall_block',
        rawLine: line,
      };
    } catch {
      return null;
    }
  }

  private parseKeyValue(line: string): ParsedFirewallEvent | null {
    const src = this.extractToken(line, ['SRC=', 'src=', 'sourceIp=', 'src_ip=']);
    if (!src || !this.isIpv4(src)) return null;

    const dst = this.extractToken(line, ['DST=', 'dst=', 'targetIp=', 'dst_ip=']);
    const dpt = this.extractToken(line, ['DPT=', 'dpt=', 'targetPort=', 'dst_port=', 'port=']);
    const targetPort = dpt ? Number(dpt) : undefined;
    const protocol = this.resolveProtocol(
      this.extractToken(line, ['PROTO=', 'proto=', 'protocol=']),
      targetPort,
    );

    return {
      sourceIp: src,
      targetIp: dst && this.isIpv4(dst) ? dst : undefined,
      targetPort: Number.isFinite(targetPort) ? targetPort : undefined,
      protocol,
      eventType: 'firewall_block',
      rawLine: line,
    };
  }

  private extractToken(line: string, prefixes: string[]): string | undefined {
    for (const prefix of prefixes) {
      const idx = line.indexOf(prefix);
      if (idx === -1) continue;
      const start = idx + prefix.length;
      const rest = line.slice(start);
      const match = rest.match(/^(\d{1,3}(?:\.\d{1,3}){3}|\d{1,5}|[a-zA-Z0-9._-]+)/);
      if (match?.[1]) return match[1];
    }
    return undefined;
  }

  private pickString(data: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
    return undefined;
  }

  private pickNumber(data: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
    }
    return undefined;
  }

  private resolveProtocol(rawProtocol: string | undefined, port?: number): string | undefined {
    const fromPort = this.protocolFromPort(port);
    if (fromPort) return fromPort;

    if (!rawProtocol) return undefined;
    const normalized = rawProtocol.toLowerCase();
    if (normalized === 'tcp' || normalized === 'udp') return normalized;
    return rawProtocol;
  }

  private protocolFromPort(port?: number): string | undefined {
    if (!port) return undefined;
    return PORT_PROTOCOL[port as keyof typeof PORT_PROTOCOL];
  }

  private isIpv4(value: string): boolean {
    const parts = value.split('.');
    if (parts.length !== 4) return false;
    return parts.every((p) => {
      const n = Number(p);
      return Number.isInteger(n) && n >= 0 && n <= 255;
    });
  }
}
