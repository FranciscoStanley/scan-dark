import {
  Entity as TypeOrmEntity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DeviceType, ThreatStatus, ThreatType, VulnerabilitySeverity } from '@scandark/shared-kernel';

@TypeOrmEntity('threat_events')
@Index(['status'])
@Index(['userId'])
export class ThreatEventOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'enum', enum: ThreatType })
  type!: ThreatType;

  @Column({ type: 'enum', enum: VulnerabilitySeverity })
  severity!: VulnerabilitySeverity;

  @Column({ type: 'enum', enum: ThreatStatus, default: ThreatStatus.ACTIVE })
  status!: ThreatStatus;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'source_ip' })
  sourceIp!: string;

  @Column({ name: 'target_ip', nullable: true })
  targetIp?: string;

  @Column({ name: 'target_port', nullable: true })
  targetPort?: number;

  @Column({ name: 'device_type', type: 'enum', enum: DeviceType, nullable: true })
  deviceType?: DeviceType;

  @Column({ type: 'text' })
  remediation!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
