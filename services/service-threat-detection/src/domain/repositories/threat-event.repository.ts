import { ThreatEvent } from '../entities/threat-event.entity';

export interface IThreatEventRepository {
  save(event: ThreatEvent): Promise<void>;
  saveMany(events: ThreatEvent[]): Promise<void>;
  findById(id: string): Promise<ThreatEvent | undefined>;
  findAll(userId?: string): Promise<ThreatEvent[]>;
}

export const THREAT_EVENT_REPOSITORY = Symbol('THREAT_EVENT_REPOSITORY');
