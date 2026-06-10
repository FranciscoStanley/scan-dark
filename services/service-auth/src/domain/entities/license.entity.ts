import { Entity } from '@scandark/shared-kernel';
import { v4 as uuidv4 } from 'uuid';

export interface LicenseProps {
  licenseKey: string;
  organizationName: string;
  maxUsers: number;
  features: string[];
  isActive: boolean;
  activatedAt?: Date;
  expiresAt: Date;
}

export class License extends Entity<string> {
  private props: LicenseProps;

  private constructor(id: string, props: LicenseProps, createdAt?: Date) {
    super(id, createdAt);
    this.props = props;
  }

  static create(props: LicenseProps): License {
    return new License(uuidv4(), props);
  }

  static reconstitute(id: string, props: LicenseProps, createdAt: Date, updatedAt: Date): License {
    const license = new License(id, props, createdAt);
    license._updatedAt = updatedAt;
    return license;
  }

  get licenseKey(): string {
    return this.props.licenseKey;
  }
  get organizationName(): string {
    return this.props.organizationName;
  }
  get maxUsers(): number {
    return this.props.maxUsers;
  }
  get features(): string[] {
    return this.props.features;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get activatedAt(): Date | undefined {
    return this.props.activatedAt;
  }

  isValid(): boolean {
    return this.props.isActive && this.props.expiresAt.getTime() > Date.now();
  }

  daysRemaining(): number {
    const diff = this.props.expiresAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  activate(): void {
    this.props.isActive = true;
    this.props.activatedAt = new Date();
    this.touch();
  }

  toPlain() {
    return {
      id: this.id,
      ...this.props,
      daysRemaining: this.daysRemaining(),
    };
  }
}
