# ScanDark

**Plataforma de segurança de rede e auditoria IoT** — microserviços com Clean Architecture, detecção de vulnerabilidades e monitoramento de ameaças em tempo real.

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Quick Start](#quick-start)
- [Documentação](#documentação)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Stack tecnológica](#stack-tecnológica)
- [Testes](#testes)
- [API Collections](#api-collections)
- [Contribuição](#contribuição)
- [Segurança](#segurança)
- [Autor](#autor)
- [Licença](#licença)

---

## Visão geral

O **ScanDark** é uma plataforma modular para auditoria de segurança em redes domésticas e corporativas. Identifica dispositivos IoT (câmeras WiFi, roteadores, Smart TVs), avalia vulnerabilidades conhecidas e detecta intrusões como acesso indevido a streams RTSP, brute-force SSH/RDP e dispositivos não autorizados.

Projetado como monorepo com **Clean Architecture** e princípios **SOLID**, cada microserviço possui domínio isolado, use cases testáveis e contratos compartilhados via packages internos.

---

## Funcionalidades

| Módulo | Capacidades |
|--------|-------------|
| **Network Scan** | Host discovery, port scan TCP, mDNS/SSDP/UPnP, auditoria WiFi e roteador |
| **Device Discovery** | Fingerprint de câmeras, TVs, roteadores, NAS, IoT e celulares |
| **Vulnerability** | Avaliação de risco, mapeamento CVE, severidade e remediação |
| **Threat Detection** | Intrusões RTSP, RDP, SSH brute-force, movimentação lateral, dispositivos desconhecidos |
| **Auth** | JWT, RBAC (`admin`, `analyst`, `viewer`) |
| **Frontend** | Dashboard dark com glassmorphism, monitor de ameaças e gestão de scans |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    frontend (Next.js :3100)                  │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST / JWT
┌─────────────────────────────▼───────────────────────────────┐
│              service-api-gateway (:3000)                     │
└───┬─────────┬─────────┬─────────┬─────────┬─────────────────┘
    │         │         │         │         │
 :3001     :3002     :3003     :3004     :3005
  auth   net-scan   devices    vuln     threats
```

Cada microserviço segue quatro camadas:

```
domain/ → application/ → infrastructure/ → presentation/
```

Diagramas, bounded contexts e decisões arquiteturais: [`docs/architecture.md`](./docs/architecture.md)

---

## Quick Start

### Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| Docker Desktop | latest |

### Instalação

**Opção A — Stack completa via Docker (recomendado):**

```bash
git clone https://github.com/seu-usuario/scan-dark.git
cd scan-dark
pnpm docker:up    # build + sobe infra, services e frontend
```

**Opção B — Desenvolvimento local com hot-reload:**

```bash
git clone https://github.com/seu-usuario/scan-dark.git
cd scan-dark
pnpm install
cp .env.example .env        # Linux / macOS
copy .env.example .env      # Windows
docker compose up -d postgres redis rabbitmq
pnpm dev
```

### URLs locais

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:3100 |
| API Gateway | http://localhost:3000 |
| Swagger (Gateway) | http://localhost:3000/docs |
| RabbitMQ Management | http://localhost:15672 (`admin` / `change-me-management-password`) |

Guia completo com troubleshooting: [`docs/getting-started.md`](./docs/getting-started.md)

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [Índice da documentação](./docs/README.md) | Hub central |
| [Getting Started](./docs/getting-started.md) | Instalação e primeiro acesso |
| [Arquitetura](./docs/architecture.md) | Diagramas, SOLID, bounded contexts |
| [Desenvolvimento](./docs/development.md) | Workflow, convenções, monorepo |
| [Variáveis de ambiente](./docs/environment-variables.md) | Referência completa de `.env` |
| [Testes](./docs/testing.md) | Vitest, coverage, estratégia |
| [Deploy](./docs/deployment.md) | Produção e Docker |
| [API Gateway](./docs/api/gateway.md) | Rotas, auth, exemplos |
| [Microserviços](./docs/services/README.md) | Catálogo de services |
| [Threat Detection](./docs/security/threat-detection.md) | Detecção de intrusões |
| [Frontend](./docs/frontend/README.md) | Next.js, design system |
| [Postman / Insomnia](./postman/README.md) | Collections de API |

---

## Estrutura do repositório

```
scan-dark/
├── frontend/                    # Next.js 15 — UI
├── services/
│   ├── service-api-gateway/     # :3000 — proxy + JWT
│   ├── service-auth/            # :3001 — autenticação
│   ├── service-network-scan/    # :3002 — varredura
│   ├── service-device-discovery/# :3003 — fingerprint
│   ├── service-vulnerability/   # :3004 — CVE / risco
│   └── service-threat-detection/# :3005 — intrusões
├── packages/
│   ├── shared-kernel/           # Entity, Result, enums
│   ├── contracts/               # DTOs compartilhados
│   └── config/                  # Portas, constantes
├── docs/                        # Documentação técnica
├── postman/                     # Collections Postman + Insomnia
├── docker-compose.yml           # PostgreSQL, Redis, RabbitMQ
└── .cursor/                     # Rules e skills (Cursor IDE)
```

---

## Stack tecnológica

| Camada | Tecnologias |
|--------|-------------|
| Backend | NestJS, TypeORM, PostgreSQL, JWT, Swagger, Vitest |
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Infra | Docker Compose, Redis, RabbitMQ |
| Monorepo | pnpm workspaces, Turborepo, TypeScript 5 |

---

## Testes

```bash
pnpm test          # Todos os serviços
pnpm test:cov      # Com coverage
pnpm lint          # ESLint
pnpm build         # Build de produção
```

Detalhes: [`docs/testing.md`](./docs/testing.md)

---

## API Collections

Collections prontas para **Postman** e **Insomnia** em [`postman/`](./postman/README.md):

- Uma collection por microserviço
- Collection master via API Gateway
- Environment local com variáveis encadeadas (`accessToken`, `scanId`, `deviceId`, `threatId`)

---

## Contribuição

Contribuições são bem-vindas. Leia [`CONTRIBUTING.md`](./CONTRIBUTING.md) antes de abrir um PR.

1. Fork do repositório
2. Branch feature (`feat/nome-da-feature`)
3. Commit seguindo [Conventional Commits](https://www.conventionalcommits.org/)
4. Testes passando (`pnpm test`)
5. Pull Request com descrição clara

---

## Segurança

**Não execute scans em redes sem autorização explícita.**

Para reportar vulnerabilidades no projeto: [`SECURITY.md`](./SECURITY.md)

---

## Autor

**Francisco Stanley Rodrigues Albuquerque**

Consulte também [`AUTHORS.md`](./AUTHORS.md).

---

## Licença

Este projeto está licenciado sob a [MIT License](./LICENSE).
