---
name: scandark-clean-architecture
description: >-
  Clean Architecture e Arquitetura Limpa para o monorepo ScanDark. Use ao criar
  ou modificar microserviços NestJS, use cases, entidades de domínio ou camadas
  de infraestrutura.
---

# Clean Architecture — ScanDark

## Camadas (dependência unidirecional)

```
presentation → application → domain ← infrastructure
```

- **domain/** — Entidades, Value Objects, interfaces de repositório. Zero imports de NestJS, TypeORM ou HTTP.
- **application/** — Use cases que orquestram domínio via interfaces.
- **infrastructure/** — Implementações concretas (TypeORM, scanners, JWT).
- **presentation/** — Controllers, Guards, Modules NestJS.

## Regras

1. Use cases **nunca** importam `@nestjs/common` ou frameworks
2. Controllers **delegam** para use cases — zero lógica de negócio
3. Erros de domínio usam `Result<T>` pattern, não throw
4. Injeção via Symbol tokens: `USER_REPOSITORY`, `NETWORK_SCANNER`
5. DTOs ficam em `@scandark/contracts`, não dentro dos services

## Criar novo use case

```typescript
// application/use-cases/exemplo.use-case.ts
export class ExemploUseCase {
  constructor(private readonly repo: IExemploRepository) {}

  async execute(input: Input): Promise<Result<Output>> {
    // lógica pura
    return Result.ok(output);
  }
}
```

## Criar novo microserviço

1. `services/service-{nome}/` com estrutura de 4 camadas
2. Registrar porta em `@scandark/config` → `SERVICE_PORTS`
3. Adicionar proxy no `service-api-gateway`
4. Documentar em `docs/services/service-{nome}.md`
5. Swagger em `/docs`
