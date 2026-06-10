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

export function isPrivateIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b! >= 16 && b! <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

export function buildPrivateIpIntelligence(ip: string): IpIntelligence {
  return {
    ip,
    isPrivate: true,
    country: 'Rede Local',
    countryCode: 'LAN',
    region: 'Rede Privada (RFC 1918)',
    city: 'Dispositivo interno',
    isp: 'Rede local / LAN',
    organization: 'Não roteável na internet pública',
  };
}
