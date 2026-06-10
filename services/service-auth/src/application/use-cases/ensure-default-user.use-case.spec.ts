import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_USER_CONFIG } from '@scandark/config';
import { UserRole } from '@scandark/shared-kernel';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IPasswordHasher, ITokenService } from '../../domain/services/token.service.interface';
import { BcryptPasswordHasher } from '../../infrastructure/security/bcrypt-password.hasher';
import { LoginUserUseCase } from './auth.use-cases';
import {
  DefaultUserSeedConfig,
  EnsureDefaultUserUseCase,
} from './ensure-default-user.use-case';

const DEFAULT_CONFIG: DefaultUserSeedConfig = {
  enabled: true,
  email: DEFAULT_USER_CONFIG.EMAIL,
  password: DEFAULT_USER_CONFIG.PASSWORD,
  name: DEFAULT_USER_CONFIG.NAME,
  role: DEFAULT_USER_CONFIG.ROLE,
};

function createInMemoryRepository(): IUserRepository & { users: Map<string, User> } {
  const users = new Map<string, User>();

  return {
    users,
    findById: vi.fn(async (id: string) => [...users.values()].find((u) => u.id === id) ?? null),
    findByEmail: vi.fn(
      async (email: string) => [...users.values()].find((u) => u.email === email) ?? null,
    ),
    save: vi.fn(async (user: User) => {
      users.set(user.id, user);
      return user;
    }),
    existsByEmail: vi.fn(async (email: string) =>
      [...users.values()].some((u) => u.email === email),
    ),
  };
}

describe('EnsureDefaultUserUseCase', () => {
  let useCase: EnsureDefaultUserUseCase;
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
    useCase = new EnsureDefaultUserUseCase(userRepository, passwordHasher, DEFAULT_CONFIG);
  });

  it('should create default admin user when email does not exist', async () => {
    vi.mocked(userRepository.existsByEmail).mockResolvedValue(false);
    vi.mocked(userRepository.save).mockImplementation(async (user) => user);

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.value?.created).toBe(true);
    expect(result.value?.email).toBe(DEFAULT_CONFIG.email);
    expect(passwordHasher.hash).toHaveBeenCalledWith(DEFAULT_CONFIG.password);
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: DEFAULT_CONFIG.email,
        name: DEFAULT_CONFIG.name,
        role: UserRole.ADMIN,
      }),
    );
  });

  it('should skip creation when default user already exists', async () => {
    vi.mocked(userRepository.existsByEmail).mockResolvedValue(true);

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.value?.created).toBe(false);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('should skip when bootstrap is disabled', async () => {
    useCase = new EnsureDefaultUserUseCase(userRepository, passwordHasher, {
      ...DEFAULT_CONFIG,
      enabled: false,
    });

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.value?.created).toBe(false);
    expect(userRepository.existsByEmail).not.toHaveBeenCalled();
  });
});

describe('Default user login flow', () => {
  it('should allow login with default credentials after bootstrap', async () => {
    const repo = createInMemoryRepository();
    const hasher = new BcryptPasswordHasher();
    const tokenService: ITokenService = {
      generateTokens: vi.fn().mockResolvedValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: 900,
      }),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };

    const ensureDefaultUser = new EnsureDefaultUserUseCase(repo, hasher, DEFAULT_CONFIG);
    const refreshStore = { store: vi.fn().mockResolvedValue(undefined) };
    const loginUser = new LoginUserUseCase(repo, hasher, tokenService, refreshStore as never);

    const seedResult = await ensureDefaultUser.execute();
    expect(seedResult.success).toBe(true);
    expect(seedResult.value?.created).toBe(true);

    const loginResult = await loginUser.execute({
      email: DEFAULT_CONFIG.email,
      password: DEFAULT_CONFIG.password,
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.value?.accessToken).toBe('access_token');
    expect(tokenService.generateTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        email: DEFAULT_CONFIG.email,
        role: UserRole.ADMIN,
      }),
    );
  });

  it('should allow login on subsequent startups when user already exists', async () => {
    const repo = createInMemoryRepository();
    const hasher = new BcryptPasswordHasher();
    const tokenService: ITokenService = {
      generateTokens: vi.fn().mockResolvedValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: 900,
      }),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };

    const ensureDefaultUser = new EnsureDefaultUserUseCase(repo, hasher, DEFAULT_CONFIG);
    const refreshStore = { store: vi.fn().mockResolvedValue(undefined) };
    const loginUser = new LoginUserUseCase(repo, hasher, tokenService, refreshStore as never);

    await ensureDefaultUser.execute();
    const secondBoot = await ensureDefaultUser.execute();
    expect(secondBoot.value?.created).toBe(false);

    const loginResult = await loginUser.execute({
      email: DEFAULT_CONFIG.email,
      password: DEFAULT_CONFIG.password,
    });

    expect(loginResult.success).toBe(true);
  });
});
