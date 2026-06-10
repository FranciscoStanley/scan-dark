import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpIpIntelligenceProvider } from './http-ip-intelligence.provider';

describe('HttpIpIntelligenceProvider', () => {
  const provider = new HttpIpIntelligenceProvider();

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return local metadata for private IPs without calling API', async () => {
    const intel = await provider.lookup('192.168.1.10');
    expect(intel.isPrivate).toBe(true);
    expect(intel.country).toBe('Rede Local');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should query external API for public IPs', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        ip: '8.8.8.8',
        country: 'United States',
        country_code: 'US',
        region: 'Virginia',
        city: 'Ashburn',
        isp: 'Google LLC',
        org: 'Google Public DNS',
        asn: 'AS15169',
      }),
    } as Response);

    const intel = await provider.lookup('8.8.8.8');
    expect(intel.isPrivate).toBe(false);
    expect(intel.country).toBe('United States');
    expect(intel.organization).toBe('Google Public DNS');
    expect(intel.isp).toBe('Google LLC');
  });
});
