import { AuditLog } from '../entities/audit-log.entity';

export interface IAuditLogRepository {
  save(log: AuditLog): Promise<AuditLog>;
  findRecent(limit?: number): Promise<AuditLog[]>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
