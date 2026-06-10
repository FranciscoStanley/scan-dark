# Deploy

Guia de implantação do ScanDark em ambientes de staging e produção.

---

## Visão geral

```
                    ┌──────────────┐
                    │   Reverse    │
                    │    Proxy     │  (nginx / Traefik / ALB)
                    │   TLS :443   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───┐ ┌─────▼─────┐ ┌────▼─────┐
     │  frontend  │ │  gateway  │ │ services │
     │   :3100    │ │   :3000   │ │ :3001-05 │
     └────────────┘ └─────┬─────┘ └────┬─────┘
                          │            │
                    ┌─────▼────────────▼─────┐
                    │  PostgreSQL / Redis /   │
                    │       RabbitMQ          │
                    └─────────────────────────┘
```

---

## Pré-requisitos de produção

| Item | Requisito |
|------|-----------|
| Node.js | ≥ 20 LTS |
| PostgreSQL | ≥ 16 |
| Reverse proxy | nginx, Traefik ou cloud LB com TLS |
| Secrets | JWT secrets, DB password via secrets manager |
| Rede | Scans restritos a redes autorizadas |

---

## Build

```bash
pnpm install --frozen-lockfile
pnpm build
```

Artefatos:

| Workspace | Output |
|-----------|--------|
| `frontend` | `.next/` + `standalone/` (se configurado) |
| `services/*` | `dist/` |
| `packages/*` | `dist/` |

---

## Variáveis de produção

Altere obrigatoriamente:

```env
JWT_ACCESS_SECRET=<random-32+-chars>
JWT_REFRESH_SECRET=<random-32+-chars>
DATABASE_URL=postgresql://user:pass@db-host:5432/scandark
CORS_ORIGIN=https://app.seudominio.com
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

Referência: [environment-variables.md](./environment-variables.md)

---

## Docker Compose (desenvolvimento)

O `docker-compose.yml` inclui apenas infraestrutura:

```bash
docker compose up -d    # PostgreSQL, Redis, RabbitMQ
pnpm dev                # Serviços Node.js no host
```

Para produção containerizada, estenda com Dockerfiles por serviço (futuro).

---

## Checklist de segurança

Antes de expor publicamente:

- [ ] JWT secrets únicos e ≥ 32 caracteres
- [ ] PostgreSQL com senha forte e acesso restrito por rede
- [ ] HTTPS terminado no reverse proxy
- [ ] CORS limitado ao domínio do frontend
- [ ] Credenciais Docker padrão alteradas
- [ ] Logs sem tokens ou senhas
- [ ] RBAC configurado (evitar contas admin desnecessárias)
- [ ] Rate limiting no gateway (quando implementado)
- [ ] Backups automáticos do PostgreSQL
- [ ] Scans limitados a redes autorizadas

Detalhes: [SECURITY.md](../SECURITY.md)

---

## Reverse proxy (nginx)

Exemplo mínimo:

```nginx
server {
    listen 443 ssl http2;
    server_name api.seudominio.com;

    ssl_certificate     /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name app.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
    }
}
```

---

## Process manager (PM2)

Exemplo para gateway:

```bash
pnpm --filter service-api-gateway build
pm2 start services/service-api-gateway/dist/main.js --name scandark-gateway
```

Repita para cada microserviço e o frontend.

---

## Health checks

| Endpoint | Serviço | Uso |
|----------|---------|-----|
| `GET /health` | API Gateway | Load balancer health check |
| `GET /docs` | Qualquer service | Verificação de startup |

---

## Monitoramento (recomendado)

| Ferramenta | Propósito |
|------------|-----------|
| Prometheus + Grafana | Métricas de serviços |
| Loki / ELK | Logs centralizados |
| Sentry | Error tracking |
| Uptime Kuma | Availability |

---

## CI/CD

Pipelines incluídos:

| Plataforma | Arquivo |
|------------|---------|
| GitHub Actions | `.github/workflows/ci.yml` |
| GitLab CI | `.gitlab-ci.yml` |

Estenda com stages de deploy conforme sua infraestrutura.

---

## Referências

- [Getting Started](./getting-started.md)
- [Variáveis de ambiente](./environment-variables.md)
- [Arquitetura](./architecture.md)
