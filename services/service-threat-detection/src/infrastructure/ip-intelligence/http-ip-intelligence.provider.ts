import { Injectable, Logger } from '@nestjs/common';
import { IP_INTELLIGENCE_CONFIG } from '@scandark/config';
import { IIpIntelligenceProvider } from '../../domain/repositories/ip-intelligence.repository';
import {
  IpIntelligence,
  buildPrivateIpIntelligence,
  isPrivateIp,
} from '../../domain/value-objects/ip-intelligence.vo';

interface IpWhoResponse {
  success: boolean;
  ip: string;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  isp?: string;
  org?: string;
  asn?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  message?: string;
}

@Injectable()
export class HttpIpIntelligenceProvider implements IIpIntelligenceProvider {
  private readonly logger = new Logger(HttpIpIntelligenceProvider.name);
  private readonly cache = new Map<string, { data: IpIntelligence; expiresAt: number }>();

  async lookup(ip: string): Promise<IpIntelligence> {
    if (isPrivateIp(ip)) {
      return buildPrivateIpIntelligence(ip);
    }

    const cached = this.cache.get(ip);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const url = `${IP_INTELLIGENCE_CONFIG.API_URL}/${ip}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(IP_INTELLIGENCE_CONFIG.TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as IpWhoResponse;
      if (!data.success) {
        throw new Error(data.message ?? 'Lookup failed');
      }

      const intel: IpIntelligence = {
        ip: data.ip ?? ip,
        isPrivate: false,
        country: data.country,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        isp: data.isp,
        organization: data.org,
        asn: data.asn,
        timezone: data.timezone,
        latitude: data.latitude,
        longitude: data.longitude,
      };

      this.cache.set(ip, {
        data: intel,
        expiresAt: Date.now() + IP_INTELLIGENCE_CONFIG.CACHE_TTL_MS,
      });

      return intel;
    } catch (error) {
      this.logger.warn(`IP lookup failed for ${ip}: ${error instanceof Error ? error.message : error}`);
      return {
        ip,
        isPrivate: false,
        country: 'Desconhecido',
        organization: 'Não foi possível identificar o proprietário',
        isp: 'Consulta indisponível',
      };
    }
  }
}
