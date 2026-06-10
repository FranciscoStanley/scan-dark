# Desenvolvimento

Guia para contribuidores: workflow, estrutura do monorepo e convenções de código.

---

## Monorepo

O ScanDark usa **pnpm workspaces** + **Turborepo**:

```
pnpm-workspace.yaml
├── frontend
├── services/*
└── packages/*
```

### Packages compartilhados

| Package | Import | Conteúdo |
|---------|--------|----------|
| `@scandark/shared-kernel` | `import { Result } from '@scandark/shared-kernel'` | Entity, Result, enums, erros |
| `@scandark/contracts` | `import { LoginDto } from '@scandark/contracts'` | DTOs com class-validator |
| `@scandark/config` | `import { SERVICE_PORTS } from '@scandark/config'` | Portas, URLs, constantes |

Ao alterar packages, rebuild:

```bash
pnpm build --filter=@scandark/shared-kernel
# ou rebuild completo
pnpm build
```

---

## Scripts Turborepo

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Watch mode em todos os workspaces |
| `pnpm build` | Build de produção |
| `pnpm test` | Vitest em todos os services |
| `pnpm test:cov` | Coverage |
| `pnpm lint` | ESLint |

### Executar um serviço isolado

```bash
pnpm --filter service-auth dev
pnpm --filter frontend dev
pnpm --filter @scandark/contracts build
```

---

## Estrutura de um microserviço

```
services/service-example/
├── src/
│   ├── domain/
│   │   ├── entities/          # Entidades de domínio
│   │   ├── repositories/      # Interfaces (ports)
│   │   └── services/          # Domain services (engines)
│   ├── application/
│   │   └── use-cases/         # Um arquivo por use case
│   ├── infrastructure/
│   │   ├── persistence/       # TypeORM repositories
│   │   └── scanners/          # Implementações concretas
│   ├── presentation/
│   │   ├── controllers/       # REST controllers
│   │   ├── guards/            # JWT guards
│   │   └── strategies/        # Passport strategies
│   ├── app.module.ts
│   └── main.ts
├── test/                      # Testes (ou *.spec.ts colocated)
├── package.json
└── tsconfig.json
```

### Regras de dependência

```
presentation → application → domain ← infrastructure
```

- **domain/** nunca importa de `infrastructure/` ou `presentation/`
- **application/** depende apenas de interfaces do domain
- **infrastructure/** implementa interfaces do domain

---

## Adicionar um endpoint

1. Defina o DTO em `packages/contracts/src/`
2. Crie o use case em `application/use-cases/`
3. Implemente persistência em `infrastructure/` (se necessário)
4. Exponha via controller em `presentation/controllers/`
5. Adicione decorators Swagger (`@ApiOperation`, `@ApiResponse`)
6. Escreva testes unitários
7. Atualize collection Postman em `postman/collections/`
8. Documente em `docs/services/`

> **Regra do projeto:** qualquer alteração relevante (não só endpoints) exige sincronizar Swagger, testes e documentação. Ver skill `.cursor/skills/sync-artifacts/`.

---

## Convenções de nomenclatura

| Elemento | Padrão | Exemplo |
|----------|--------|---------|
| Use case | verbo + substantivo | `CreateNetworkScanUseCase` |
| Entity | substantivo | `NetworkScan`, `ThreatEvent` |
| Repository interface | `I` + nome | `IUserRepository` |
| Repository impl | tech + nome | `TypeOrmUserRepository` |
| Controller | domínio + Controller | `AuthController` |
| DTO | ação + Dto | `CreateScanDto`, `LoginDto` |
| Arquivo | kebab-case | `network-scan.controller.ts` |

---

## Swagger / OpenAPI

Cada serviço expõe Swagger em `/docs`. Configure em `main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('ScanDark — Service Name')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
```

---

## Cursor IDE

Regras e skills em `.cursor/`:

| Path | Propósito |
|------|-----------|
| `.cursor/rules/` | Regras automáticas por contexto |
| `.cursor/skills/` | Clean Architecture, SOLID, network security, **sync-artifacts** |

---

## Git workflow

```bash
git checkout -b feat/nome-da-feature
# desenvolver
pnpm test && pnpm build
git commit -m "feat(threat-detection): add arp spoofing detection"
git push origin feat/nome-da-feature
```

Commits: [Conventional Commits](https://www.conventionalcommits.org/)

Detalhes de PR: [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## Debugging

### NestJS (microserviço)

```bash
pnpm --filter service-auth dev
# ou com inspector
node --inspect-brk node_modules/.bin/nest start --watch
```

### Next.js (frontend)

```bash
pnpm --filter frontend dev
```

Logs estruturados aparecem no terminal de cada serviço.

---

## Referências

- [Arquitetura](./architecture.md)
- [Testes](./testing.md)
- [Variáveis de ambiente](./environment-variables.md)
