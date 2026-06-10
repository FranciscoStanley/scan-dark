# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e o versionamento [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado

- **Sistema de licença comercial** — entidade `licenses`, bootstrap trial, ativação por chave (admin), validação no gateway
- **Persistência PostgreSQL** para devices, vulnerabilities e threat events (substitui Maps in-memory)
- **Package `@scandark/nest-auth`** — JWT guard, Roles guard, InternalOrJwt guard para auth service-to-service
- **Endpoint `POST /auth/refresh`** com rotação de refresh tokens via Redis (fallback in-memory)
- **RBAC enforced** — `RolesGuard`, registro público sempre `viewer`, `POST /auth/users` para admin
- **Audit log** — `POST /auth/audit`, `GET /auth/audit` (admin)
- **Rate limiting** no API Gateway (`@nestjs/throttler`)
- **LicenseGuard** no gateway — bloqueia APIs protegidas sem licença ativa
- **JWT em todos os microserviços** — validação direta ou via `x-internal-secret` + `x-user-id`
- **Isolamento por usuário** — devices, vulnerabilities e threats filtrados por `userId`
- **Integração vulnerability no scan** — Full Assessment e IoT Fingerprint disparam assess automático
- **Frontend** — páginas `/dashboard/vulnerabilities` e `/dashboard/license`, refresh token automático
- **Migration SQL** — `database/migrations/001_initial_schema.sql`
- Testes: license use cases, refresh token, repositórios async

### Alterado

- `DATABASE_SYNC=true` explícito em dev (produção: migrations + `DATABASE_SYNC=false`)
- Credenciais default em `.env.example` substituídas por placeholders seguros
- Device discovery refatorado com TypeORM e Clean Architecture completa
- Vulnerability service refatorado com use cases e TypeORM

---

## [1.0.0] — 2026-06-09

### Adicionado

- Monorepo com pnpm workspaces e Turborepo
- **service-auth** — registro, login JWT, perfil
- **service-network-scan** — host discovery, port scan TCP, mDNS/SSDP/UPnP
- **service-device-discovery** — fingerprint de dispositivos IoT
- **service-vulnerability** — motor de avaliação com CVE
- **service-threat-detection** — detecção de intrusões
- **service-api-gateway** — proxy reverso unificado
- **frontend** — dashboard Next.js 15
- Docker Compose, Swagger, testes Vitest, documentação

[1.0.0]: https://github.com/seu-usuario/scan-dark/releases/tag/v1.0.0
