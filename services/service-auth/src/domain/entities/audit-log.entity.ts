import { Entity } from '@scandark/shared-kernel';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogProps {
  userId: string;
  action: string;
  resource: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export class AuditLog extends Entity<string> {
  private props: AuditLogProps;

  private constructor(id: string, props: AuditLogProps, createdAt?: Date) {
    super(id, createdAt);
    this.props = props;
  }

  static create(props: AuditLogProps): AuditLog {
    return new AuditLog(uuidv4(), props);
  }

  toPlain() {
    return { id: this.id, ...this.props, createdAt: this.createdAt.toISOString() };
  }
}
