# Variáveis de Ambiente

Referência completa das variáveis de configuração do ScanDark.

Copie `.env.example` para `.env` na raiz do monorepo. Todos os serviços leem deste arquivo.

---

## Banco de dados

| Variável | Obrigatória | Padrão (dev) | Descrição |
|----------|-------------|--------------|-----------|
| `DATABASE_URL` | Sim | `postgresql://scandark:scandark_secret@localhost:5432/scandark` | Connection string PostgreSQL |
| `DATABASE_SYNC` | Não | `true` (dev) | TypeORM synchronize — **false em produção**; use `database/migrations/001_initial_schema.sql` |

Usado por: todos os serviços com persistência (auth, network-scan, device-discovery, vulnerability, threat-detection)

---

## Cache e mensageria

| Variável | Obrigatória | Padrão (dev) | Descrição |
|----------|-------------|--------------|-----------|
| `REDIS_URL` | Não | `redis://localhost:6379` | Redis para refresh tokens (`service-auth`) |
| `RABBITMQ_URL` | Não | `amqp://scandark:scandark_secret@localhost:5672` | RabbitMQ para jobs assíncronos (futuro) |
| `RABBITMQ_DEFAULT_USER` | Não | `scandark` | Usuário AMQP dos microserviços |
| `RABBITMQ_DEFAULT_PASS` | Não | `scandark_secret` | Senha do usuário AMQP |
| `RABBITMQ_MANAGEMENT_URL` | Não | `http://localhost:15672` | Console de gestão RabbitMQ |
| `RABBITMQ_MANAGEMENT_USER` | Não | `admin` | Usuário admin do console (criado no bootstrap) |
| `RABBITMQ_MANAGEMENT_PASS` | Não | `change-me-management-password` | Senha do usuário admin do console |

O serviço `rabbitmq-init` cria automaticamente o usuário de gestão (`RABBITMQ_MANAGEMENT_USER`) com permissões de administrador ao subir o Docker Compose.

---

## Autenticação JWT

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `JWT_ACCESS_SECRET` | Sim | Secret para access tokens |
| `JWT_REFRESH_SECRET` | Sim | Secret para refresh tokens |
| `INTERNAL_SERVICE_SECRET` | Sim (prod) | Secret para chamadas internas entre microserviços (`x-internal-secret`) |
| `RATE_LIMIT_TTL_MS` | Não | `60000` | Janela do rate limit no gateway (ms) |
| `RATE_LIMIT_MAX` | Não | `100` | Máximo de requisições por janela no gateway |
| `LICENSE_REQUIRE_ACTIVE` | Não | `true` | Gateway exige licença ativa para APIs de produto |
| `LICENSE_TRIAL_KEY` | Não | `SCANDARK-TRIAL-DEV-0001` | Chave trial criada no bootstrap |
| `LICENSE_TRIAL_ORGANIZATION` | Não | `ScanDark Trial` | Nome da organização trial |
| `LICENSE_TRIAL_DAYS` | Não | `365` | Validade da licença trial em dias |

> **Produção:** Gere secrets aleatórios com ≥ 32 caracteres. Nunca commite valores reais.

```bash
# Exemplo de geração (Linux/macOS)
openssl rand -base64 32
```

---

## CORS

| Variável | Obrigatória | Padrão (dev) | Descrição |
|----------|-------------|--------------|-----------|
| `CORS_ORIGIN` | Não | `http://localhost:3100` | Origem permitida para requisições cross-origin |

Em produção, liste domínios específicos. Evite `*`.

---

## Usuário padrão (service-auth bootstrap)

Na inicialização, o `service-auth` cria um usuário admin se ainda não existir. Processo idempotente e configurável:

| Variável | Obrigatória | Padrão (dev) | Descrição |
|----------|-------------|--------------|-----------|
| `DEFAULT_USER_ENABLED` | Não | `true` | `false` desabilita o bootstrap |
| `DEFAULT_USER_EMAIL` | Não | `admin@your-company.com` | Email do usuário padrão |
| `DEFAULT_USER_PASSWORD` | Não | `ChangeMe-Secure-Password-123!` | Senha do usuário padrão |
| `DEFAULT_USER_NAME` | Não | `Administrator` | Nome completo |
| `DEFAULT_USER_ROLE` | Não | `admin` | Role: `admin`, `analyst` ou `viewer` |

> **Produção:** defina credenciais fortes via variáveis de ambiente ou `DEFAULT_USER_ENABLED=false`.

---

## Frontend

| Variável | Obrigatória | Padrão (dev) | Descrição |
|----------|-------------|--------------|-----------|
| `NEXT_PUBLIC_API_URL` | Sim | `http://localhost:3000` | URL base do API Gateway |

Variáveis `NEXT_PUBLIC_*` são expostas ao browser. Não inclua secrets aqui.

---

## URLs dos microserviços (Gateway)

Usadas pelo `service-api-gateway` para proxy reverso:

| Variável | Padrão (dev) | Serviço |
|----------|--------------|---------|
| `AUTH_SERVICE_URL` | `http://localhost:3001` | service-auth |
| `NETWORK_SCAN_SERVICE_URL` | `http://localhost:3002` | service-network-scan |
| `DEVICE_DISCOVERY_SERVICE_URL` | `http://localhost:3003` | service-device-discovery |
| `VULNERABILITY_SERVICE_URL` | `http://localhost:3004` | service-vulnerability |
| `THREAT_DETECTION_SERVICE_URL` | `http://localhost:3005` | service-threat-detection |

Em produção com Docker/Kubernetes, use nomes de serviço internos (ex: `http://service-auth:3001`).

---

## Inteligência de IP (service-threat-detection)

| Variável | Obrigatória | Padrão (dev) | Descrição |
|----------|-------------|--------------|-----------|
| `IP_INTELLIGENCE_API_URL` | Não | `https://ipwho.is` | API de geolocalização e proprietário de IP |
| `IP_INTELLIGENCE_TIMEOUT_MS` | Não | `5000` | Timeout da consulta em milissegundos |
| `IP_INTELLIGENCE_CACHE_TTL_MS` | Não | `3600000` | TTL do cache em memória (1 hora) |

IPs privados (RFC 1918) são classificados localmente sem chamada externa.

---

## Monitoramento de rede (service-threat-detection)

| Variável | Obrigatória | Padrão (dev) | Descrição |
|----------|-------------|--------------|-----------|
| `MONITOR_NETWORK` | Não | `192.168.1.0` | Sub-rede padrão para varredura |
| `MONITOR_CIDR` | Não | `24` | Máscara CIDR (máx. /24 na varredura) |

---

## Ingestão de logs do firewall

| Variável | Obrigatória | Padrão (dev) | Descrição |
|----------|-------------|--------------|-----------|
| `FIREWALL_LOG_ENABLED` | Não | `false` (dev), `true` (Docker) | Habilita leitura automática do arquivo de log |
| `FIREWALL_LOG_PATH` | Não | `./logs/firewall.log` | Caminho do arquivo monitorado |
| `FIREWALL_LOG_POLL_MS` | Não | `5000` | Intervalo de polling em ms |
| `FIREWALL_INGEST_TOKEN` | Não | vazio | Token opcional para `POST /threats/ingest` (header `X-Ingest-Token`) |

---

## Exemplo completo (.env)

```env
# Database
DATABASE_URL=postgresql://scandark:scandark_secret@localhost:5432/scandark

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://scandark:scandark_secret@localhost:5672
RABBITMQ_DEFAULT_USER=scandark
RABBITMQ_DEFAULT_PASS=scandark_secret
RABBITMQ_MANAGEMENT_URL=http://localhost:15672
RABBITMQ_MANAGEMENT_USER=admin
RABBITMQ_MANAGEMENT_PASS=change-me-management-password

# JWT (change in production!)
JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-chars

# CORS
CORS_ORIGIN=http://localhost:3100

# Default admin user (service-auth bootstrap)
DEFAULT_USER_ENABLED=true
DEFAULT_USER_EMAIL=admin@your-company.com
DEFAULT_USER_PASSWORD=ChangeMe-Secure-Password-123!
DEFAULT_USER_NAME=Administrator
DEFAULT_USER_ROLE=admin

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Service URLs (API Gateway → microservices)
AUTH_SERVICE_URL=http://localhost:3001
NETWORK_SCAN_SERVICE_URL=http://localhost:3002
DEVICE_DISCOVERY_SERVICE_URL=http://localhost:3003
VULNERABILITY_SERVICE_URL=http://localhost:3004
THREAT_DETECTION_SERVICE_URL=http://localhost:3005
```

---

## Ambientes

| Ambiente | Arquivo | Observação |
|----------|---------|------------|
| Desenvolvimento | `.env` | Gitignored — nunca commitar |
| CI | Variáveis no pipeline | Ver `.github/workflows/ci.yml` |
| Produção | Secrets manager / K8s Secrets | Não use `.env` em produção |

---

## Referências

- [Getting Started](./getting-started.md)
- [Deploy](./deployment.md)
- [SECURITY.md](../SECURITY.md)
