import { AuditLog } from '../../domain/entities/audit-log.entity';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';

export interface CreateAuditLogInput {
  userId: string;
  action: string;
  resource: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export class CreateAuditLogUseCase {
  constructor(private readonly repository: IAuditLogRepository) {}

  async execute(input: CreateAuditLogInput): Promise<AuditLog> {
    const log = AuditLog.create(input);
    return this.repository.save(log);
  }
}

export class ListAuditLogsUseCase {
  constructor(private readonly repository: IAuditLogRepository) {}

  async execute(limit = 100): Promise<AuditLog[]> {
    return this.repository.findRecent(limit);
  }
}
