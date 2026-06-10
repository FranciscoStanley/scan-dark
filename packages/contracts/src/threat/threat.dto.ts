import {
  IsArray,
  IsEnum,
  IsIP,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceType, ThreatType } from '@scandark/shared-kernel';

export class AnalyzeThreatDto {
  @IsIP(4)
  sourceIp!: string;

  @IsIP(4)
  @IsOptional()
  targetIp?: string;

  @IsNumber()
  @IsOptional()
  targetPort?: number;

  @IsEnum(DeviceType)
  @IsOptional()
  deviceType?: DeviceType;

  @IsString()
  @IsOptional()
  protocol?: string;

  @IsString()
  @IsOptional()
  eventType?: string;
}

export class IpIntelligenceResponse {
  ip!: string;
  isPrivate!: boolean;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export class ThreatEventResponse {
  id!: string;
  type!: ThreatType;
  severity!: string;
  status!: string;
  title!: string;
  description!: string;
  sourceIp!: string;
  targetIp?: string;
  targetPort?: number;
  deviceType?: string;
  remediation!: string;
  detectedAt!: string;
  sourceIpIntel?: IpIntelligenceResponse;
}

export class ThreatStatsResponse {
  activeThreats!: number;
  criticalThreats!: number;
  resolvedToday!: number;
  cameraIntrusions!: number;
  remoteAccessAttempts!: number;
  blockedAttempts!: number;
}

export class MonitorNetworkDto {
  @IsIP(4)
  @IsNotEmpty()
  network!: string;

  @IsNumber()
  @IsOptional()
  cidr?: number;
}

export class NetworkDefaultsResponse {
  network!: string;
  cidr!: number;
  source!: 'environment' | 'auto-detected';
  interfaceName?: string;
}

export class IngestFirewallEventDto {
  @IsIP(4)
  sourceIp!: string;

  @IsIP(4)
  @IsOptional()
  targetIp?: string;

  @IsNumber()
  @IsOptional()
  targetPort?: number;

  @IsString()
  @IsOptional()
  protocol?: string;

  @IsString()
  @IsOptional()
  eventType?: string;
}

export class IngestFirewallLogsDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lines?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngestFirewallEventDto)
  @IsOptional()
  events?: IngestFirewallEventDto[];
}

export class IngestionStatusResponse {
  enabled!: boolean;
  watching!: boolean;
  logPath?: string;
  pollMs?: number;
  linesProcessed!: number;
  threatsCreated!: number;
  lastIngestAt?: string;
  lastError?: string;
}

export class IngestFirewallLogsResponse {
  parsed!: number;
  threatsCreated!: number;
  threats!: ThreatEventResponse[];
}
