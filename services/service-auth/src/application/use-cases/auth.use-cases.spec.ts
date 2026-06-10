import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, ValidationError, UnauthorizedError } from '@scandark/shared-kernel';
import { User } from '../../domain/entities/user.entity';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
} from './auth.use-cases';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IPasswordHasher, ITokenService } from '../../domain/services/token.service.interface';
import { RedisRefreshTokenStore } from '../../infrastructure/cache/redis-refresh-token.store';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepository: IUserRepository;
  let passwordHasher: IPasswordHasher;

  beforeEach(() => {
    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      existsByEmail: vi.fn(),
    };
    passwordHasher = {
      hash: vi.fn().mockResolvedValue('hashed_password'),
      compare: vi.fn(),
    };
    useCase = new RegisterUserUseCase(userRepository, passwordHasher);
  });

  it('should register a new user with viewer role only', async () => {
    vi.mocked(userRepository.existsByEmail).mockResolvedValue(false);
    vi.mocked(userRepository.save).mockImplementation(async (user) => user);

    const result = await useCase.execute({
      email: 'analyst@scandark.io',
      password: 'SecurePass123!',
      name: 'Security Analyst',
    });

    expect(result.success).toBe(true);
    expect(result.value?.email).toBe('analyst@scandark.io');
    expect(result.value?.role).toBe(UserRole.VIEWER);
    expect(passwordHasher.hash).toHaveBeenCalledWith('SecurePass123!');
  });

  it('should fail when email already exists', async () => {
    vi.mocked(userRepository.existsByEmail).mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'existing@scandark.io',
      password: 'SecurePass123!',
      name: 'Existing User',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ValidationError);
  });
});

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let userRepository: IUserRepository;
  let passwordHasher: IPasswordHasher;
  let tokenService: ITokenService;
  let refreshStore: RedisRefreshTokenStore;

  beforeEach(() => {
    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      existsByEmail: vi.fn(),
    };
    passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    };
    tokenService = {
      generateTokens: vi.fn().mockResolvedValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: 900,
      }),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };
    refreshStore = {
      store: vi.fn().mockResolvedValue(undefined),
      isValid: vi.fn(),
      revoke: vi.fn(),
      onModuleDestroy: vi.fn(),
    } as unknown as RedisRefreshTokenStore;
    useCase = new LoginUserUseCase(userRepository, passwordHasher, tokenService, refreshStore);
  });

  it('should return tokens on valid credentials', async () => {
    const user = User.create({
      email: 'analyst@scandark.io',
      passwordHash: 'hashed',
      name: 'Analyst',
      role: UserRole.ANALYST,
    });
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(passwordHasher.compare).mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'analyst@scandark.io',
      password: 'SecurePass123!',
    });

    expect(result.success).toBe(true);
    expect(result.value?.accessToken).toBe('access_token');
    expect(refreshStore.store).toHaveBeenCalled();
  });

  it('should fail on invalid password', async () => {
    const user = User.create({
      email: 'analyst@scandark.io',
      passwordHash: 'hashed',
      name: 'Analyst',
      role: UserRole.ANALYST,
    });
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    const result = await useCase.execute({
      email: 'analyst@scandark.io',
      password: 'WrongPassword!',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(UnauthorizedError);
  });
});

describe('RefreshTokenUseCase', () => {
  it('should issue new tokens when refresh token is valid', async () => {
    const tokenService: ITokenService = {
      generateTokens: vi.fn().mockResolvedValue({
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
        expiresIn: 900,
      }),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn().mockResolvedValue({
        sub: 'user-1',
        email: 'a@b.com',
        role: UserRole.VIEWER,
      }),
    };
    const refreshStore = {
      isValid: vi.fn().mockResolvedValue(true),
      revoke: vi.fn().mockResolvedValue(undefined),
      store: vi.fn().mockResolvedValue(undefined),
    } as unknown as RedisRefreshTokenStore;

    const useCase = new RefreshTokenUseCase(tokenService, refreshStore);
    const result = await useCase.execute('valid_refresh_token');

    expect(result.success).toBe(true);
    expect(result.value?.accessToken).toBe('new_access');
  });
});
