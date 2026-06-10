import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThreatStatus } from '@scandark/shared-kernel';
import { ThreatEvent } from '../../domain/entities/threat-event.entity';
import { IThreatEventRepository } from '../../domain/repositories/threat-event.repository';
import { ThreatEventOrmEntity } from './threat-event.orm-entity';

@Injectable()
export class TypeOrmThreatEventRepository implements IThreatEventRepository {
  constructor(
    @InjectRepository(ThreatEventOrmEntity)
    private readonly repository: Repository<ThreatEventOrmEntity>,
  ) {}

  async save(event: ThreatEvent): Promise<void> {
    await this.repository.save(this.toOrm(event));
  }

  async saveMany(events: ThreatEvent[]): Promise<void> {
    for (const event of events) {
      const duplicate = await this.findDuplicate(event);
      if (!duplicate) {
        await this.save(event);
      }
    }
  }

  async findById(id: string): Promise<ThreatEvent | undefined> {
    const row = await this.repository.findOne({ where: { id } });
    return row ? this.toDomain(row) : undefined;
  }

  async findAll(userId?: string): Promise<ThreatEvent[]> {
    const rows = await this.repository.find({
      where: userId ? { userId } : {},
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private async findDuplicate(event: ThreatEvent): Promise<ThreatEvent | undefined> {
    const plain = event.toPlain();
    const rows = await this.repository.find({
      where: {
        status: ThreatStatus.ACTIVE,
        type: plain.type,
        sourceIp: plain.sourceIp,
        title: plain.title,
      },
    });
    for (const row of rows) {
      const existing = this.toDomain(row).toPlain();
      if (existing.targetIp === plain.targetIp && existing.targetPort === plain.targetPort) {
        return this.toDomain(row);
      }
    }
    return undefined;
  }

  private toOrm(event: ThreatEvent): ThreatEventOrmEntity {
    const plain = event.toPlain();
    return this.repository.create({
      id: plain.id,
      userId: plain.userId,
      type: plain.type,
      severity: plain.severity,
      status: plain.status,
      title: plain.title,
      description: plain.description,
      sourceIp: plain.sourceIp,
      targetIp: plain.targetIp,
      targetPort: plain.targetPort,
      deviceType: plain.deviceType,
      remediation: plain.remediation,
      metadata: plain.metadata,
    });
  }

  private toDomain(row: ThreatEventOrmEntity): ThreatEvent {
    return ThreatEvent.reconstitute(
      row.id,
      {
        type: row.type,
        severity: row.severity,
        status: row.status,
        title: row.title,
        description: row.description,
        sourceIp: row.sourceIp,
        targetIp: row.targetIp,
        targetPort: row.targetPort,
        deviceType: row.deviceType,
        remediation: row.remediation,
        userId: row.userId,
        metadata: row.metadata,
      },
      row.createdAt,
      row.updatedAt,
    );
  }
}
