import {
  Entity,
  ThreatType,
  ThreatStatus,
  VulnerabilitySeverity,
  DeviceType,
} from '@scandark/shared-kernel';
import { v4 as uuidv4 } from 'uuid';

export interface ThreatEventProps {
  type: ThreatType;
  severity: VulnerabilitySeverity;
  status: ThreatStatus;
  title: string;
  description: string;
  sourceIp: string;
  targetIp?: string;
  targetPort?: number;
  deviceType?: DeviceType;
  remediation: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export class ThreatEvent extends Entity<string> {
  private props: ThreatEventProps;

  private constructor(id: string, props: ThreatEventProps, createdAt?: Date) {
    super(id, createdAt);
    this.props = props;
  }

  static create(props: ThreatEventProps): ThreatEvent {
    return new ThreatEvent(uuidv4(), props);
  }

  static reconstitute(
    id: string,
    props: ThreatEventProps,
    createdAt: Date,
    updatedAt: Date,
  ): ThreatEvent {
    const event = new ThreatEvent(id, props, createdAt);
    event._updatedAt = updatedAt;
    return event;
  }

  get type(): ThreatType {
    return this.props.type;
  }
  get severity(): VulnerabilitySeverity {
    return this.props.severity;
  }
  get status(): ThreatStatus {
    return this.props.status;
  }
  get title(): string {
    return this.props.title;
  }
  get sourceIp(): string {
    return this.props.sourceIp;
  }

  resolve(): void {
    this.props.status = ThreatStatus.RESOLVED;
    this.touch();
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  toPlain() {
    return { id: this.id, ...this.props, detectedAt: this.createdAt.toISOString() };
  }
}
