import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { INTERNAL_SERVICE_CONFIG, JWT_CONFIG } from '@scandark/config';
import { AuthenticatedUser } from '../types';

@Injectable()
export class InternalOrJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      user?: AuthenticatedUser;
    }>();

    const internalSecret = request.headers['x-internal-secret'];
    const userId = request.headers['x-user-id'];

    if (internalSecret === INTERNAL_SERVICE_CONFIG.SECRET && userId) {
      request.user = { sub: userId, email: 'internal@service', role: 'admin' as AuthenticatedUser['role'] };
      return true;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authentication');
    }

    try {
      const token = authHeader.slice(7);
      const payload = await this.jwtService.verifyAsync<AuthenticatedUser>(token, {
        secret: JWT_CONFIG.ACCESS_SECRET,
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
