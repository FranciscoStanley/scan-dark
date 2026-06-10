# API — Visão Geral

Referência central da API REST do ScanDark.

---

## Base URL

| Ambiente | URL |
|----------|-----|
| Desenvolvimento | `http://localhost:3000` |
| Produção | `https://api.seudominio.com` |

Todas as requisições do frontend e integrações externas passam pelo **API Gateway** (`service-api-gateway`).

Acesso direto aos microserviços (portas 3001–3005) é útil para desenvolvimento e debug.

---

## Autenticação

### Fluxo JWT

```mermaid
sequenceDiagram
    participant C as Cliente
    participant GW as API Gateway

    C->>GW: POST /auth/register
    GW-->>C: 201 Created
    C->>GW: POST /auth/login
    GW-->>C: 200 accessToken + refreshToken
    C->>GW: GET /* com Authorization Bearer
    GW-->>C: 200 recurso protegido
```

### Endpoints públicos

| Método | Rota |
|--------|------|
| GET | `/health` |
| POST | `/auth/register` |
| POST | `/auth/login` |

### Endpoints protegidos

Todos os demais exigem header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Roles (RBAC)

| Role | Permissões |
|------|------------|
| `admin` | Acesso total |
| `analyst` | Scans, análises, resolução de ameaças |
| `viewer` | Somente leitura |

---

## Formato de requisição

- **Content-Type:** `application/json`
- **Encoding:** UTF-8
- Datas em ISO 8601: `2026-06-09T12:00:00.000Z`

### Resposta de erro padrão

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## Swagger / OpenAPI

Documentação interativa disponível em cada serviço:

| Serviço | URL |
|---------|-----|
| API Gateway | http://localhost:3000/docs |
| service-auth | http://localhost:3001/docs |
| service-network-scan | http://localhost:3002/docs |
| service-device-discovery | http://localhost:3003/docs |
| service-vulnerability | http://localhost:3004/docs |
| service-threat-detection | http://localhost:3005/docs |

---

## Mapa de rotas (Gateway)

### Auth

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Registrar usuário |
| POST | `/auth/login` | Autenticar |
| GET | `/auth/profile` | Perfil (JWT) |

### Network Scan

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/scans` | Criar scan |
| GET | `/scans` | Listar scans |
| GET | `/scans/:id` | Detalhes do scan |

### Device Discovery

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/devices/fingerprint` | Classificar dispositivo |
| GET | `/devices/scan/:scanId` | Dispositivos por scan |

### Vulnerability

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/vulnerabilities/assess` | Avaliar dispositivo |
| GET | `/vulnerabilities/device/:deviceId` | Vulnerabilidades |
| GET | `/vulnerabilities/summary/:scanId` | Resumo do scan |

### Threat Detection

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/threats/analyze` | Analisar evento |
| POST | `/threats/monitor` | Monitorar rede |
| GET | `/threats` | Todas as ameaças |
| GET | `/threats/active` | Ameaças ativas |
| GET | `/threats/stats` | Estatísticas |
| PATCH | `/threats/:id/resolve` | Resolver ameaça |

Detalhes do gateway: [gateway.md](./gateway.md)

---

## Collections

Importe collections prontas para Postman e Insomnia:

→ [`postman/README.md`](../../postman/README.md)

---

## Fluxo integrado

```bash
# 1. Login (usuário admin padrão — criado automaticamente no bootstrap)
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@your-company.com","password":"ChangeMe-Secure-Password-123!"}' \
  | jq -r '.accessToken')

# 2. Criar scan
SCAN=$(curl -s -X POST http://localhost:3000/scans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Audit","type":"full_assessment","targetNetwork":"192.168.1.0","cidr":24}' \
  | jq -r '.id')

# 3. Fingerprint
DEVICE=$(curl -s -X POST http://localhost:3000/devices/fingerprint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ipAddress\":\"192.168.1.100\",\"hostname\":\"Hikvision\",\"openPorts\":[554],\"scanId\":\"$SCAN\"}" \
  | jq -r '.id')

# 4. Avaliar vulnerabilidades
curl -s -X POST http://localhost:3000/vulnerabilities/assess \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\":\"$DEVICE\",\"ipAddress\":\"192.168.1.100\",\"deviceType\":\"camera\",\"openPorts\":[554]}"

# 5. Monitorar ameaças
curl -s -X POST http://localhost:3000/threats/monitor \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"network":"192.168.1.0","cidr":24}'
```

---

## Referências

- [API Gateway](./gateway.md)
- [Microserviços](../services/README.md)
- [Variáveis de ambiente](../environment-variables.md)
