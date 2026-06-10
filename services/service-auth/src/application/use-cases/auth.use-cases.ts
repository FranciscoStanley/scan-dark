import { createHash } from 'crypto';
import { Result, UnauthorizedError, ValidationError, UserRole } from '@scandark/shared-kernel';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository';
import {
  IPasswordHasher,
  ITokenService,
  AuthTokens,
} from '../../domain/services/token.service.interface';
import { RedisRefreshTokenStore } from '../../infrastructure/cache/redis-refresh-token.store';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface CreateUserInput extends RegisterInput {
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: RegisterInput): Promise<Result<User>> {
    const email = input.email.toLowerCase().trim();

    if (await this.userRepository.existsByEmail(email)) {
      return Result.fail(new ValidationError('Email already registered'));
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = User.create({
      email,
      passwordHash,
      name: input.name.trim(),
      role: UserRole.VIEWER,
    });

    const saved = await this.userRepository.save(user);
    return Result.ok(saved);
  }
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly refreshStore: RedisRefreshTokenStore,
  ) {}

  async execute(input: LoginInput): Promise<Result<AuthTokens>> {
    const user = await this.userRepository.findByEmail(input.email.toLowerCase().trim());

    if (!user || !user.isActive) {
      return Result.fail(new UnauthorizedError('Invalid credentials'));
    }

    const valid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!valid) {
      return Result.fail(new UnauthorizedError('Invalid credentials'));
    }

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const tokenHash = createHash('sha256').update(tokens.refreshToken).digest('hex');
    await this.refreshStore.store(user.id, tokenHash, 7 * 24 * 60 * 60);

    return Result.ok(tokens);
  }
}

export class GetUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<Result<User>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(new UnauthorizedError('User not found'));
    }
    return Result.ok(user);
  }
}

export class CreateUserByAdminUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<Result<User>> {
    const email = input.email.toLowerCase().trim();

    if (await this.userRepository.existsByEmail(email)) {
      return Result.fail(new ValidationError('Email already registered'));
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = User.create({
      email,
      passwordHash,
      name: input.name.trim(),
      role: input.role,
    });

    const saved = await this.userRepository.save(user);
    return Result.ok(saved);
  }
}

export class RefreshTokenUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly refreshStore: RedisRefreshTokenStore,
  ) {}

  async execute(refreshToken: string): Promise<Result<AuthTokens>> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      const valid = await this.refreshStore.isValid(payload.sub, tokenHash);

      if (!valid) {
        return Result.fail(new UnauthorizedError('Invalid refresh token'));
      }

      await this.refreshStore.revoke(payload.sub, tokenHash);
      const tokens = await this.tokenService.generateTokens(payload);
      const newHash = createHash('sha256').update(tokens.refreshToken).digest('hex');
      await this.refreshStore.store(payload.sub, newHash, 7 * 24 * 60 * 60);

      return Result.ok(tokens);
    } catch {
      return Result.fail(new UnauthorizedError('Invalid refresh token'));
    }
  }
}
