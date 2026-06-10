import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_CONFIG, DATABASE_SYNC, DEFAULT_USER_CONFIG } from '@scandark/config';
import { JwtAuthModule } from '@scandark/nest-auth';
import { UserRole } from '@scandark/shared-kernel';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  GetUserProfileUseCase,
  RefreshTokenUseCase,
  CreateUserByAdminUseCase,
} from './application/use-cases/auth.use-cases';
import { CreateAuditLogUseCase, ListAuditLogsUseCase } from './application/use-cases/audit-log.use-case';
import { ActivateLicenseUseCase, GetLicenseStatusUseCase } from './application/use-cases/license.use-cases';
import { EnsureDefaultUserUseCase } from './application/use-cases/ensure-default-user.use-case';
import { DefaultUserBootstrap } from './infrastructure/bootstrap/default-user.bootstrap';
import { DefaultLicenseBootstrap } from './infrastructure/bootstrap/default-license.bootstrap';
import { RedisRefreshTokenStore } from './infrastructure/cache/redis-refresh-token.store';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { LICENSE_REPOSITORY } from './domain/repositories/license.repository';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository';
import { PASSWORD_HASHER, TOKEN_SERVICE } from './domain/services/token.service.interface';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { TypeOrmLicenseRepository } from './infrastructure/persistence/typeorm-license.repository';
import { TypeOrmAuditLogRepository } from './infrastructure/persistence/typeorm-audit-log.repository';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { LicenseOrmEntity } from './infrastructure/persistence/license.orm-entity';
import { AuditLogOrmEntity } from './infrastructure/persistence/audit-log.orm-entity';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password.hasher';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { LicenseController } from './presentation/controllers/license.controller';
import { AuditController } from './presentation/controllers/audit.controller';

@Module({
  imports: [
    JwtAuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: DATABASE_CONFIG.URL,
      entities: [UserOrmEntity, LicenseOrmEntity, AuditLogOrmEntity],
      synchronize: DATABASE_SYNC,
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([UserOrmEntity, LicenseOrmEntity, AuditLogOrmEntity]),
    JwtModule.register({}),
  ],
  controllers: [AuthController, LicenseController, AuditController],
  providers: [
    RedisRefreshTokenStore,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: LICENSE_REPOSITORY, useClass: TypeOrmLicenseRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: TypeOrmAuditLogRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    {
      provide: RegisterUserUseCase,
      useFactory: (repo: TypeOrmUserRepository, hasher: BcryptPasswordHasher) =>
        new RegisterUserUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: CreateUserByAdminUseCase,
      useFactory: (repo: TypeOrmUserRepository, hasher: BcryptPasswordHasher) =>
        new CreateUserByAdminUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: LoginUserUseCase,
      useFactory: (
        repo: TypeOrmUserRepository,
        hasher: BcryptPasswordHasher,
        tokens: JwtTokenService,
        refreshStore: RedisRefreshTokenStore,
      ) => new LoginUserUseCase(repo, hasher, tokens, refreshStore),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE, RedisRefreshTokenStore],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (tokens: JwtTokenService, refreshStore: RedisRefreshTokenStore) =>
        new RefreshTokenUseCase(tokens, refreshStore),
      inject: [TOKEN_SERVICE, RedisRefreshTokenStore],
    },
    {
      provide: GetUserProfileUseCase,
      useFactory: (repo: TypeOrmUserRepository) => new GetUserProfileUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: GetLicenseStatusUseCase,
      useFactory: (repo: TypeOrmLicenseRepository) => new GetLicenseStatusUseCase(repo),
      inject: [LICENSE_REPOSITORY],
    },
    {
      provide: ActivateLicenseUseCase,
      useFactory: (repo: TypeOrmLicenseRepository) => new ActivateLicenseUseCase(repo),
      inject: [LICENSE_REPOSITORY],
    },
    {
      provide: CreateAuditLogUseCase,
      useFactory: (repo: TypeOrmAuditLogRepository) => new CreateAuditLogUseCase(repo),
      inject: [AUDIT_LOG_REPOSITORY],
    },
    {
      provide: ListAuditLogsUseCase,
      useFactory: (repo: TypeOrmAuditLogRepository) => new ListAuditLogsUseCase(repo),
      inject: [AUDIT_LOG_REPOSITORY],
    },
    {
      provide: EnsureDefaultUserUseCase,
      useFactory: (repo: TypeOrmUserRepository, hasher: BcryptPasswordHasher) =>
        new EnsureDefaultUserUseCase(repo, hasher, {
          enabled: DEFAULT_USER_CONFIG.ENABLED,
          email: DEFAULT_USER_CONFIG.EMAIL,
          password: DEFAULT_USER_CONFIG.PASSWORD,
          name: DEFAULT_USER_CONFIG.NAME,
          role: DEFAULT_USER_CONFIG.ROLE as UserRole,
        }),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    DefaultUserBootstrap,
    DefaultLicenseBootstrap,
  ],
  exports: [TOKEN_SERVICE, GetLicenseStatusUseCase, CreateAuditLogUseCase],
})
export class AuthModule {}
