import {
  IsArray,
  IsEnum,
  IsIP,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ScanType } from '@scandark/shared-kernel';

export class CreateScanDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(ScanType)
  type!: ScanType;

  @IsIP(4)
  targetNetwork!: string;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(32)
  cidr?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  ports?: number[];
}

export class DiscoveredHostResponse {
  ipAddress!: string;
  macAddress?: string;
  hostname?: string;
  isAlive!: boolean;
  responseTimeMs?: number;
  openPorts?: number[];
}

export class ScanResultsResponse {
  hosts!: DiscoveredHostResponse[];
  totalHostsScanned!: number;
  aliveHosts!: number;
  durationMs!: number;
}

export class ScanResponse {
  id!: string;
  name!: string;
  type!: ScanType;
  targetNetwork!: string;
  status!: string;
  progress!: number;
  createdAt!: string;
  completedAt?: string;
  results?: ScanResultsResponse;
}

export class DeviceResponse {
  id!: string;
  ipAddress!: string;
  macAddress?: string;
  hostname?: string;
  deviceType!: string;
  vendor?: string;
  os?: string;
  openPorts!: number[];
  riskScore!: number;
  lastSeen!: string;
}

export class VulnerabilityResponse {
  id!: string;
  deviceId!: string;
  title!: string;
  description!: string;
  severity!: string;
  cveId?: string;
  remediation!: string;
  detectedAt!: string;
}

export class NetworkSummaryResponse {
  totalDevices!: number;
  criticalVulnerabilities!: number;
  highVulnerabilities!: number;
  mediumVulnerabilities!: number;
  lowVulnerabilities!: number;
  averageRiskScore!: number;
  deviceTypeBreakdown!: Record<string, number>;
}
