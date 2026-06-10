import {
  Entity as TypeOrmEntity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScanStatus, ScanType } from '@scandark/shared-kernel';

@TypeOrmEntity('network_scans')
export class NetworkScanOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: ScanType })
  type!: ScanType;

  @Column({ name: 'target_network' })
  targetNetwork!: string;

  @Column({ default: 24 })
  cidr!: number;

  @Column('int', { array: true, default: [] })
  ports!: number[];

  @Column({ type: 'enum', enum: ScanStatus })
  status!: ScanStatus;

  @Column({ default: 0 })
  progress!: number;

  @Column({ type: 'jsonb', nullable: true })
  results?: Record<string, unknown>;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
