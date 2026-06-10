import { Result, UserRole } from '@scandark/shared-kernel';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IPasswordHasher } from '../../domain/services/token.service.interface';

export interface DefaultUserSeedConfig {
  enabled: boolean;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface EnsureDefaultUserResult {
  created: boolean;
  email: string;
}

export class EnsureDefaultUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly config: DefaultUserSeedConfig,
  ) {}

  async execute(): Promise<Result<EnsureDefaultUserResult>> {
    if (!this.config.enabled) {
      return Result.ok({ created: false, email: this.config.email });
    }

    const email = this.config.email.toLowerCase().trim();

    if (await this.userRepository.existsByEmail(email)) {
      return Result.ok({ created: false, email });
    }

    const passwordHash = await this.passwordHasher.hash(this.config.password);
    const user = User.create({
      email,
      passwordHash,
      name: this.config.name.trim(),
      role: this.config.role,
    });

    await this.userRepository.save(user);

    return Result.ok({ created: true, email });
  }
}
