import {
  Entity as TypeOrmEntity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@TypeOrmEntity('licenses')
export class LicenseOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'license_key', unique: true })
  licenseKey!: string;

  @Column({ name: 'organization_name' })
  organizationName!: string;

  @Column({ name: 'max_users', default: 10 })
  maxUsers!: number;

  @Column({ type: 'jsonb', default: [] })
  features!: string[];

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'activated_at', type: 'timestamptz', nullable: true })
  activatedAt?: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
