import { Injectable } from '@nestjs/common';
import { ThreatStatus } from '@scandark/shared-kernel';
import { ThreatEvent } from '../../domain/entities/threat-event.entity';
import { IThreatEventRepository } from '../../domain/repositories/threat-event.repository';

@Injectable()
export class InMemoryThreatEventRepository implements IThreatEventRepository {
  private readonly events = new Map<string, ThreatEvent>();

  async save(event: ThreatEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  async saveMany(events: ThreatEvent[]): Promise<void> {
    for (const event of events) {
      const duplicate = await this.findDuplicate(event);
      if (!duplicate) {
        await this.save(event);
      }
    }
  }

  private async findDuplicate(event: ThreatEvent): Promise<ThreatEvent | undefined> {
    const plain = event.toPlain();
    const all = await this.findAll();
    return all.find((e) => {
      const existing = e.toPlain();
      return (
        e.status === ThreatStatus.ACTIVE &&
        existing.type === plain.type &&
        existing.sourceIp === plain.sourceIp &&
        existing.targetIp === plain.targetIp &&
        existing.targetPort === plain.targetPort &&
        existing.title === plain.title
      );
    });
  }

  async findById(id: string): Promise<ThreatEvent | undefined> {
    return this.events.get(id);
  }

  async findAll(userId?: string): Promise<ThreatEvent[]> {
    const all = Array.from(this.events.values());
    if (!userId) return all;
    return all.filter((e) => e.userId === userId);
  }
}
