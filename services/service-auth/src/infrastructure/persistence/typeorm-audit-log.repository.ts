import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditLogOrmEntity } from './audit-log.orm-entity';

@Injectable()
export class TypeOrmAuditLogRepository implements IAuditLogRepository {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repository: Repository<AuditLogOrmEntity>,
  ) {}

  async save(log: AuditLog): Promise<AuditLog> {
    const plain = log.toPlain();
    const orm = this.repository.create({
      id: plain.id,
      userId: plain.userId,
      action: plain.action,
      resource: plain.resource,
      ipAddress: plain.ipAddress,
      metadata: plain.metadata,
    });
    await this.repository.save(orm);
    return log;
  }

  async findRecent(limit = 100): Promise<AuditLog[]> {
    const rows = await this.repository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map(
      (row) =>
        AuditLog.create({
          userId: row.userId,
          action: row.action,
          resource: row.resource,
          ipAddress: row.ipAddress,
          metadata: row.metadata,
        }),
    );
  }
}
