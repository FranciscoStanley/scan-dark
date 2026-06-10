import { Entity as TypeOrmEntity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@TypeOrmEntity('audit_logs')
export class AuditLogOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column()
  action!: string;

  @Column()
  resource!: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
