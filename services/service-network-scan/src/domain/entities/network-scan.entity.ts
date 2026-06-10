import { Entity, ScanStatus, ScanType } from '@scandark/shared-kernel';
import { v4 as uuidv4 } from 'uuid';

export interface ScanProps {
  name: string;
  type: ScanType;
  targetNetwork: string;
  cidr: number;
  ports: number[];
  status: ScanStatus;
  progress: number;
  results?: ScanResults;
  errorMessage?: string;
  userId: string;
}

export interface DiscoveredHost {
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  isAlive: boolean;
  responseTimeMs?: number;
  openPorts?: number[];
}

export interface OpenPort {
  port: number;
  protocol: 'tcp' | 'udp';
  service?: string;
  banner?: string;
  state: 'open' | 'closed' | 'filtered';
}

export interface ScanResults {
  hosts: DiscoveredHost[];
  totalHostsScanned: number;
  aliveHosts: number;
  durationMs: number;
}

export class NetworkScan extends Entity<string> {
  private props: ScanProps;

  private constructor(id: string, props: ScanProps, createdAt?: Date) {
    super(id, createdAt);
    this.props = props;
  }

  static create(input: Omit<ScanProps, 'status' | 'progress'>): NetworkScan {
    return new NetworkScan(uuidv4(), {
      ...input,
      status: ScanStatus.PENDING,
      progress: 0,
    });
  }

  static reconstitute(id: string, props: ScanProps, createdAt: Date, updatedAt: Date): NetworkScan {
    const scan = new NetworkScan(id, props, createdAt);
    (scan as unknown as { _updatedAt: Date })._updatedAt = updatedAt;
    return scan;
  }

  get name(): string {
    return this.props.name;
  }
  get type(): ScanType {
    return this.props.type;
  }
  get targetNetwork(): string {
    return this.props.targetNetwork;
  }
  get cidr(): number {
    return this.props.cidr;
  }
  get ports(): number[] {
    return this.props.ports;
  }
  get status(): ScanStatus {
    return this.props.status;
  }
  get progress(): number {
    return this.props.progress;
  }
  get results(): ScanResults | undefined {
    return this.props.results;
  }
  get userId(): string {
    return this.props.userId;
  }

  start(): void {
    this.props.status = ScanStatus.RUNNING;
    this.props.progress = 0;
    this.touch();
  }

  updateProgress(progress: number): void {
    this.props.progress = Math.min(100, Math.max(0, progress));
    this.touch();
  }

  complete(results: ScanResults): void {
    this.props.status = ScanStatus.COMPLETED;
    this.props.progress = 100;
    this.props.results = results;
    this.touch();
  }

  fail(errorMessage: string): void {
    this.props.status = ScanStatus.FAILED;
    this.props.errorMessage = errorMessage;
    this.touch();
  }

  toPlain() {
    return {
      id: this.id,
      ...this.props,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
