import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT_CONFIG } from '@scandark/config';
import {
  AuthTokens,
  ITokenService,
  TokenPayload,
} from '../../domain/services/token.service.interface';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateTokens(payload: TokenPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: JWT_CONFIG.ACCESS_SECRET,
        expiresIn: JWT_CONFIG.ACCESS_EXPIRES_IN,
      }),
      this.jwtService.signAsync(payload, {
        secret: JWT_CONFIG.REFRESH_SECRET,
        expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN,
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: JWT_CONFIG.ACCESS_SECRET,
    });
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: JWT_CONFIG.REFRESH_SECRET,
    });
  }
}
