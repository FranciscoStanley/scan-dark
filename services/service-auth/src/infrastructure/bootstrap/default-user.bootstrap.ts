import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DEFAULT_USER_CONFIG } from '@scandark/config';
import { Result } from '@scandark/shared-kernel';
import { EnsureDefaultUserUseCase } from '../../application/use-cases/ensure-default-user.use-case';

@Injectable()
export class DefaultUserBootstrap implements OnModuleInit {
  private readonly logger = new Logger(DefaultUserBootstrap.name);

  constructor(private readonly ensureDefaultUser: EnsureDefaultUserUseCase) {}

  async onModuleInit(): Promise<void> {
    const result = await this.ensureDefaultUser.execute();

    if (Result.isFail(result)) {
      this.logger.error(`Falha ao criar usuário padrão: ${result.error.message}`);
      return;
    }

    const { created, email } = result.value!;

    if (!DEFAULT_USER_CONFIG.ENABLED) {
      this.logger.debug('Bootstrap de usuário padrão desabilitado (DEFAULT_USER_ENABLED=false)');
      return;
    }

    if (created) {
      this.logger.log(`Usuário padrão criado: ${email} (role: ${DEFAULT_USER_CONFIG.ROLE})`);
      return;
    }

    this.logger.log(`Usuário padrão já existe: ${email}`);
  }
}
