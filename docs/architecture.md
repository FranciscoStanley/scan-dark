# Arquitetura

Documentação arquitetural da plataforma ScanDark — visão de sistema, princípios de design e bounded contexts.

---

## Visão geral do sistema

```mermaid
flowchart TB
    FE["frontend<br/>Next.js App Router :3100"]
    GW["service-api-gateway<br/>JWT Guard + Proxy :3000"]
    AUTH["service-auth :3001<br/>Identity Context"]
    SCAN["service-network-scan :3002<br/>Recon Context"]
    DEV["service-device-discovery :3003<br/>Recon Context"]
    VULN["service-vulnerability :3004<br/>Risk Context"]
    THR["service-threat-detection :3005<br/>Threat Intel Context"]
    DB[("PostgreSQL / Redis / RabbitMQ")]

    FE -->|"HTTPS / REST"| GW
    GW --> AUTH
    GW --> SCAN
    GW --> DEV
    AUTH --> DB
    SCAN --> DB
    DEV --> DB
    VULN --> DB
    THR --> DB
    SCAN --> VULN
    DEV --> VULN
    SCAN --> THR
    DEV --> THR
```

---

## Estilo arquitetural

| Aspecto | Decisão |
|---------|---------|
| Padrão | Microserviços com API Gateway |
| Comunicação | REST síncrona (HTTP) |
| Persistência | PostgreSQL via TypeORM |
| Mensageria | RabbitMQ (assíncrono — roadmap) |
| Cache | Redis (roadmap) |
| Autenticação | JWT stateless |
| Monorepo | pnpm workspaces + Turborepo |

---

## Clean Architecture (por microserviço)

Cada serviço isola regras de negócio de frameworks e infraestrutura:

```mermaid
flowchart BT
    subgraph presentation["presentation/"]
        P["Controllers, Guards, Strategies (NestJS)"]
    end
    subgraph application["application/"]
        A["Use Cases — orquestração"]
    end
    subgraph domain["domain/"]
        D["Entities, Interfaces, Domain Services<br/>(zero dependências externas)"]
    end
    subgraph infrastructure["infrastructure/"]
        I["TypeORM, Scanners, JWT, HTTP clients"]
    end

    presentation --> application --> domain
    infrastructure --> domain
```

### Regra de dependência

```mermaid
flowchart LR
    PR["presentation"] --> AP["application"] --> DM["domain"]
    IN["infrastructure"] --> DM
```

O **domain** define interfaces (ports). A **infrastructure** implementa (adapters).

---

## Princípios SOLID

| Princípio | Aplicação no ScanDark |
|-----------|----------------------|
| **S** — Single Responsibility | Um use case = uma ação (`CreateNetworkScanUseCase`) |
| **O** — Open/Closed | Novos scanners via `INetworkScanner` sem alterar use cases |
| **L** — Liskov Substitution | `TypeOrmUserRepository` substituível por in-memory em testes |
| **I** — Interface Segregation | `IWifiAuditor`, `IRouterAuditor` separados |
| **D** — Dependency Inversion | Use cases dependem de abstrações via Symbol tokens |

---

## Bounded Contexts (DDD)

| Context | Serviços | Responsabilidade |
|---------|----------|------------------|
| **Identity** | service-auth | Usuários, JWT, RBAC |
| **Network Reconnaissance** | network-scan, device-discovery | Descoberta e classificação |
| **Risk Assessment** | service-vulnerability | CVE, severidade, remediação |
| **Threat Intelligence** | service-threat-detection | Intrusões, alertas, monitoramento |

Comunicação entre contexts via API REST (anti-corruption layer no gateway).

---

## Packages compartilhados

```mermaid
flowchart LR
    SK["@scandark/shared-kernel<br/>Entity · Result · enums"]
    CT["@scandark/contracts<br/>DTOs + class-validator"]
    CF["@scandark/config<br/>Portas · URLs · thresholds"]
    NA["@scandark/nest-auth<br/>Guards JWT compartilhados"]

    CT --> SK
    NA --> SK
    NA --> CF
```

| Package | Conteúdo | Dependências |
|---------|----------|--------------|
| `@scandark/shared-kernel` | `Entity`, `Result`, enums, erros | Nenhuma |
| `@scandark/contracts` | DTOs + class-validator | shared-kernel |
| `@scandark/config` | Portas, URLs, `IOT_SIGNATURES` | Nenhuma |

---

## Fluxo de dados — Avaliação completa

```mermaid
sequenceDiagram
    participant U as Usuário
    participant FE as Frontend
    participant GW as API Gateway
    participant AU as service-auth
    participant NS as network-scan
    participant DD as device-discovery
    participant VU as vulnerability
    participant TD as threat-detection

    U->>FE: Login
    FE->>GW: POST /auth/login
    GW->>AU: JWT
    AU-->>FE: accessToken

    FE->>GW: POST /scans (full_assessment)
    GW->>NS: host discovery + port scan
    NS-->>FE: scanId + hosts

    FE->>GW: POST /devices/fingerprint
    GW->>DD: classificação IoT
    DD-->>FE: deviceId + tipo

    FE->>GW: POST /vulnerabilities/assess
    GW->>VU: CVEs + risk score
    VU-->>FE: vulnerabilidades

    FE->>GW: POST /threats/monitor
    GW->>TD: alertas ativos
    TD-->>FE: dashboard consolidado
```

---

## Comunicação entre serviços

### Atual (síncrona)

```mermaid
flowchart LR
    C["Client"] --> GW["Gateway"] --> S["Service (HTTP)"]
```

O gateway valida JWT e injeta `x-user-id` para services que precisam de contexto de usuário.

### Roadmap (assíncrona)

```mermaid
flowchart LR
    NS["Network Scan"] -->|publish| MQ["RabbitMQ"]
    MQ -->|consume| TD["Threat Detection"]
    MQ --> NSV["Notification Service"]
```

Casos de uso: scans longos, alertas em tempo real, retry de jobs.

---

## Decisões arquiteturais (ADRs resumidos)

| # | Decisão | Justificativa |
|---|---------|---------------|
| ADR-001 | Microserviços vs monolito | Domínios distintos (auth, scan, threats) com escalabilidade independente |
| ADR-002 | Clean Architecture | Testabilidade e isolamento de regras de negócio |
| ADR-003 | API Gateway centralizado | Ponto único de auth, CORS e roteamento |
| ADR-004 | JWT stateless | Simplicidade; refresh token para sessões longas |
| ADR-005 | Monorepo pnpm | Compartilhamento de contratos sem publicar npm packages |
| ADR-006 | Vitest | Velocidade e compatibilidade com Jest API |

---

## Segurança arquitetural

| Camada | Mecanismo |
|--------|-----------|
| Gateway | JWT validation, CORS |
| Services | Bearer auth, RBAC (futuro por endpoint) |
| Network | Scans restritos a redes autorizadas |
| Data | PostgreSQL com credenciais via env |
| Secrets | Nunca em código; `.env` gitignored |

---

## Referências

- [Desenvolvimento](./development.md)
- [API Gateway](./api/gateway.md)
- [Threat Detection](./security/threat-detection.md)
- [Deploy](./deployment.md)
