---
name: scandark-software-architecture
description: >-
  Arquitetura de software e padrões do monorepo ScanDark. Use ao tomar decisões
  arquiteturais, adicionar microserviços, integrar serviços ou planejar features.
---

# Arquitetura de Software — ScanDark

## Monorepo

```
scan-dark/
├── frontend                    # Frontend Next.js
├── services/service-*          # Microserviços NestJS
├── packages/shared-kernel      # Domínio compartilhado
├── packages/contracts          # DTOs
├── packages/config             # Configuração centralizada
└── docs/                       # Documentação
```

## Padrões Adotados

| Padrão | Uso |
|--------|-----|
| Clean Architecture | Separação de camadas por service |
| Result Pattern | Erros de domínio sem exceptions |
| Repository Pattern | Abstração de persistência |
| API Gateway | Ponto de entrada único |
| DTO + Validation | class-validator nos contracts |
| Symbol Injection | DI desacoplada no NestJS |

## Decisões de Comunicação

- **Frontend → Backend:** REST via API Gateway (porta 3000)
- **Service → Service:** Via Gateway (não comunicação direta do frontend)
- **Eventos async (futuro):** RabbitMQ para scans longos

## Adicionar Feature

1. Identificar bounded context (auth, scan, threat, etc.)
2. Se novo contexto → novo `service-{nome}`
3. Se existente → use case na camada application
4. DTO em `@scandark/contracts`
5. Enum em `@scandark/shared-kernel` se compartilhado
6. Proxy no gateway + docs + testes Vitest

## Segurança

- JWT access (15min) + refresh (7d)
- RBAC: admin > analyst > viewer
- CORS restrito ao frontend
- Secrets via `.env`, nunca commitados

## Referência

Documentação completa: `docs/architecture.md`
