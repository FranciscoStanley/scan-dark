import {
  Entity as TypeOrmEntity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DeviceType } from '@scandark/shared-kernel';

@TypeOrmEntity('network_devices')
@Index(['identityKey', 'userId'], { unique: true })
export class NetworkDeviceOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'ip_address' })
  ipAddress!: string;

  @Column({ name: 'mac_address', nullable: true })
  macAddress?: string;

  @Column({ nullable: true })
  hostname?: string;

  @Column({ name: 'device_type', type: 'enum', enum: DeviceType, default: DeviceType.UNKNOWN })
  deviceType!: DeviceType;

  @Column({ nullable: true })
  vendor?: string;

  @Column({ nullable: true })
  os?: string;

  @Column({ name: 'open_ports', type: 'int', array: true, default: [] })
  openPorts!: number[];

  @Column({ type: 'jsonb', default: [] })
  services!: { port: number; name: string; version?: string; banner?: string }[];

  @Column({ name: 'risk_score', default: 0 })
  riskScore!: number;

  @Column({ name: 'scan_id', type: 'uuid' })
  scanId!: string;

  @Column({ name: 'identity_key' })
  identityKey!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
