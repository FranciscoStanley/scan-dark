import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateLicenseDto {
  @IsString()
  @IsNotEmpty()
  licenseKey!: string;
}

export class LicenseStatusResponse {
  isActive!: boolean;
  licenseKey!: string;
  organizationName!: string;
  expiresAt!: string;
  maxUsers!: number;
  features!: string[];
  daysRemaining!: number;
}

export class AuditLogResponse {
  id!: string;
  userId!: string;
  action!: string;
  resource!: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt!: string;
}
