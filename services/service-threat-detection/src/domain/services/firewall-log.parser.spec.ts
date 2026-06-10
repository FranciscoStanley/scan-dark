import { describe, it, expect } from 'vitest';
import { FirewallLogParser } from './firewall-log.parser';

describe('FirewallLogParser', () => {
  const parser = new FirewallLogParser();

  it('should parse iptables-style log lines', () => {
    const event = parser.parse(
      'IN=eth0 OUT= MAC= SRC=203.0.113.45 DST=192.168.1.100 PROTO=TCP DPT=554',
    );
    expect(event?.sourceIp).toBe('203.0.113.45');
    expect(event?.targetIp).toBe('192.168.1.100');
    expect(event?.targetPort).toBe(554);
    expect(event?.protocol).toBe('rtsp');
  });

  it('should parse JSON log lines', () => {
    const event = parser.parse(
      JSON.stringify({
        sourceIp: '198.51.100.22',
        targetIp: '192.168.1.50',
        targetPort: 3389,
        protocol: 'rdp',
      }),
    );
    expect(event?.sourceIp).toBe('198.51.100.22');
    expect(event?.targetPort).toBe(3389);
  });

  it('should ignore invalid lines', () => {
    expect(parser.parse('')).toBeNull();
    expect(parser.parse('no ip here')).toBeNull();
  });

  it('should ignore comment lines even if they contain SRC tokens', () => {
    expect(
      parser.parse('# IN=wan SRC=203.0.113.45 DST=192.168.1.100 PROTO=TCP DPT=554'),
    ).toBeNull();
  });
});
