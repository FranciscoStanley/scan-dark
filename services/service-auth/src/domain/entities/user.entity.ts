import { Entity, UserRole } from '@scandark/shared-kernel';
import { v4 as uuidv4 } from 'uuid';

export interface UserProps {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export class User extends Entity<string> {
  private props: UserProps;

  private constructor(id: string, props: UserProps, createdAt?: Date) {
    super(id, createdAt);
    this.props = props;
  }

  static create(props: Omit<UserProps, 'isActive'> & { isActive?: boolean }): User {
    return new User(uuidv4(), {
      ...props,
      isActive: props.isActive ?? true,
    });
  }

  static reconstitute(id: string, props: UserProps, createdAt: Date, updatedAt: Date): User {
    const user = new User(id, props, createdAt);
    (user as unknown as { _updatedAt: Date })._updatedAt = updatedAt;
    return user;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  toPlain() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
