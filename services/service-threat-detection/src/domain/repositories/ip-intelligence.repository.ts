import { IpIntelligence } from '../value-objects/ip-intelligence.vo';

export interface IIpIntelligenceProvider {
  lookup(ip: string): Promise<IpIntelligence>;
}

export const IP_INTELLIGENCE_PROVIDER = Symbol('IP_INTELLIGENCE_PROVIDER');
