import { Entity, DeviceType } from '@scandark/shared-kernel';
import { v4 as uuidv4 } from 'uuid';

export interface DeviceProps {
  userId: string;
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  deviceType: DeviceType;
  vendor?: string;
  os?: string;
  openPorts: number[];
  services: DeviceService[];
  riskScore: number;
  scanId: string;
}

export interface DeviceService {
  port: number;
  name: string;
  version?: string;
  banner?: string;
}

export class NetworkDevice extends Entity<string> {
  private props: DeviceProps;

  private constructor(id: string, props: DeviceProps, createdAt?: Date) {
    super(id, createdAt);
    this.props = props;
  }

  static identityKey(ipAddress: string, macAddress?: string): string {
    if (macAddress) {
      return `mac:${macAddress.toLowerCase().replace(/[:-]/g, '')}`;
    }
    return `ip:${ipAddress}`;
  }

  static create(props: DeviceProps): NetworkDevice {
    return new NetworkDevice(uuidv4(), props);
  }

  static reconstitute(
    id: string,
    props: DeviceProps,
    createdAt: Date,
    updatedAt?: Date,
  ): NetworkDevice {
    const device = new NetworkDevice(id, props, createdAt);
    if (updatedAt) {
      device._updatedAt = updatedAt;
    }
    return device;
  }

  get ipAddress(): string {
    return this.props.ipAddress;
  }
  get macAddress(): string | undefined {
    return this.props.macAddress;
  }
  get scanId(): string {
    return this.props.scanId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get deviceType(): DeviceType {
    return this.props.deviceType;
  }
  get riskScore(): number {
    return this.props.riskScore;
  }
  get openPorts(): number[] {
    return this.props.openPorts;
  }

  refreshFromFingerprint(props: DeviceProps): void {
    this.props = props;
    this.touch();
  }

  toPlain() {
    return { id: this.id, ...this.props, lastSeen: this.updatedAt.toISOString() };
  }
}
