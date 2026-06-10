# API Gateway — service-api-gateway

Ponto de entrada unificado da plataforma ScanDark. Responsável por roteamento, validação JWT e proxy para microserviços downstream.

| | |
|---|---|
| **Porta** | 3000 |
| **Swagger** | http://localhost:3000/docs |
| **Diretório** | `services/service-api-gateway` |

---

## Responsabilidades

- Proxy reverso para todos os microserviços
- Validação de JWT em rotas protegidas
- Validação de licença ativa (`LicenseGuard`) em rotas de produto
- Rate limiting global (`RATE_LIMIT_MAX` por `RATE_LIMIT_TTL_MS`)
- Injeção de `x-user-id` após autenticação
- Health check agregado
- CORS (via variável `CORS_ORIGIN`)

---

## Autenticação

| Tipo | Rotas |
|------|-------|
| **Públicas** | `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| **Protegidas (JWT + licença)** | `/scans`, `/devices`, `/vulnerabilities`, `/threats` |
| **Protegidas (JWT)** | `/auth/profile`, `/auth/license/*`, `/auth/audit` |

Header obrigatório em rotas protegidas:

```
Authorization: Bearer <accessToken>
```

### Proxy de auth

Rotas `/auth/*` são encaminhadas ao `service-auth` **sem validação JWT no gateway**. O header `Authorization` do cliente é **repassado integralmente** ao serviço downstream — necessário para `GET /auth/profile` e demais rotas autenticadas de auth.

---

## Mapa de rotas

### Health

| Método | Rota | Destino |
|--------|------|---------|
| GET | `/health` | Gateway (local) |

### Auth → service-auth (:3001)

| Método | Rota | Auth |
|--------|------|------|
| POST | `/auth/register` | — |
| POST | `/auth/login` | — |
| POST | `/auth/refresh` | — |
| GET | `/auth/profile` | JWT |
| GET | `/auth/license/status` | JWT |
| POST | `/auth/license/activate` | JWT (admin) |
| POST | `/auth/users` | JWT (admin) |
| GET | `/auth/audit` | JWT (admin) |

### Scans → service-network-scan (:3002)

| Método | Rota | Auth |
|--------|------|------|
| POST | `/scans` | JWT |
| GET | `/scans` | JWT |
| GET | `/scans/:id` | JWT |

### Devices → service-device-discovery (:3003)

| Método | Rota | Auth |
|--------|------|------|
| POST | `/devices/fingerprint` | JWT |
| GET | `/devices/scan/:scanId` | JWT |

### Vulnerabilities → service-vulnerability (:3004)

| Método | Rota | Auth |
|--------|------|------|
| POST | `/vulnerabilities/assess` | JWT |
| GET | `/vulnerabilities/device/:deviceId` | JWT |
| GET | `/vulnerabilities/summary/:scanId` | JWT |

### Threats → service-threat-detection (:3005)

| Método | Rota | Auth |
|--------|------|------|
| POST | `/threats/analyze` | JWT |
| POST | `/threats/monitor` | JWT |
| GET | `/threats` | JWT |
| GET | `/threats/active` | JWT |
| GET | `/threats/stats` | JWT |
| PATCH | `/threats/:id/resolve` | JWT |

---

## Headers

| Header | Origem | Descrição |
|--------|--------|-----------|
| `Authorization` | Cliente | Bearer JWT token |
| `x-user-id` | Gateway | ID do usuário (extraído do JWT) — injetado em rotas de scan |
| `Content-Type` | Cliente | `application/json` para POST/PATCH |

---

## Health check

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "service": "service-api-gateway",
  "timestamp": "2026-06-09T12:00:00.000Z",
  "services": [
    "service-auth",
    "service-network-scan",
    "service-device-discovery",
    "service-vulnerability",
    "service-threat-detection"
  ]
}
```

---

## Exemplos

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@your-company.com","password":"ChangeMe-Secure-Password-123!"}'
```

### Perfil (após login)

```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <accessToken>"
```

### Criar scan

```bash
curl -X POST http://localhost:3000/scans \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full Assessment",
    "type": "full_assessment",
    "targetNetwork": "192.168.1.0",
    "cidr": 24
  }'
```

### Monitorar ameaças

```bash
curl -X POST http://localhost:3000/threats/monitor \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"network":"192.168.1.0","cidr":24}'
```

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `AUTH_SERVICE_URL` | URL do service-auth |
| `NETWORK_SCAN_SERVICE_URL` | URL do service-network-scan |
| `DEVICE_DISCOVERY_SERVICE_URL` | URL do service-device-discovery |
| `VULNERABILITY_SERVICE_URL` | URL do service-vulnerability |
| `THREAT_DETECTION_SERVICE_URL` | URL do service-threat-detection |
| `JWT_ACCESS_SECRET` | Secret para validação JWT |
| `CORS_ORIGIN` | Origem permitida |

---

## Tratamento de erros

| Status | Cenário |
|--------|---------|
| 401 | Token ausente, expirado ou inválido |
| 403 | Sem permissão (RBAC — futuro) |
| 404 | Recurso não encontrado no serviço downstream |
| 502 | Microserviço indisponível |

---

## Referências

- [API — Visão geral](./README.md)
- [Variáveis de ambiente](../environment-variables.md)
- Collection: [`postman/collections/scandark-api-gateway.postman_collection.json`](../../postman/collections/scandark-api-gateway.postman_collection.json)
