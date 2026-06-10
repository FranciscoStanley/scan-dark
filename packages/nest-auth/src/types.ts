import { UserRole } from '@scandark/shared-kernel';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
}
