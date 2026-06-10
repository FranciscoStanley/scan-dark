# Getting Started

Guia de instalação e configuração do ambiente de desenvolvimento ScanDark.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Verificação |
|------------|---------------|-------------|
| Node.js | 20 | `node -v` |
| pnpm | 9 | `pnpm -v` |
| Docker Desktop | latest | `docker -v` |
| Git | 2.x | `git --version` |

### Habilitar pnpm (se necessário)

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

---

## Instalação passo a passo

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/scan-dark.git
cd scan-dark
```

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Configurar variáveis de ambiente

```bash
# Linux / macOS
cp .env.example .env

# Windows (PowerShell / CMD)
copy .env.example .env
```

Edite `.env` se necessário. Referência completa: [environment-variables.md](./environment-variables.md)

> **Importante:** Em produção, altere `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` para valores aleatórios com pelo menos 32 caracteres.

### 4. Subir a aplicação

**Stack completa (Docker — recomendado para testar):**

```bash
pnpm docker:up
```

Isso faz build e sobe: PostgreSQL, Redis, RabbitMQ, 6 microserviços e frontend.

**Apenas infraestrutura (desenvolvimento local com hot-reload):**

```bash
docker compose up -d postgres redis rabbitmq
pnpm dev
```

---

## URLs de desenvolvimento

| Recurso | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:3100 | Interface web |
| API Gateway | http://localhost:3000 | Ponto de entrada REST |
| Swagger Gateway | http://localhost:3000/docs | Documentação interativa |
| RabbitMQ UI | http://localhost:15672 | Management console (ver credenciais abaixo) |

Swagger por serviço: `http://localhost:300X/docs` (X = 1–5)

### RabbitMQ Management

Acesse http://localhost:15672 após `pnpm docker:up`. O usuário de gestão é criado automaticamente pelo bootstrap `rabbitmq-init`:

| Campo | Valor padrão (dev) |
|-------|-------------------|
| Usuário | `admin` |
| Senha | `change-me-management-password` |

O usuário `scandark` / `scandark_secret` é reservado para conexões AMQP dos microserviços (`RABBITMQ_URL`).

---

## Primeiro acesso

O **service-auth** cria automaticamente um usuário admin na inicialização. Não é necessário registrar manualmente para começar.

| Campo | Valor padrão |
|-------|--------------|
| Email | admin@your-company.com |
| Senha | ChangeMe-Secure-Password-123! |
| Role | admin |

Credenciais configuráveis via `DEFAULT_USER_*` — ver [environment-variables.md](./environment-variables.md).

### Via frontend

1. Acesse http://localhost:3100
2. Faça **Login** com o usuário padrão acima
3. No **Dashboard**, inicie um **Novo Scan** → tipo **Avaliação Completa**
4. Acesse **Ameaças** para monitoramento de intrusões

### Via API (cURL)

```bash
# 1. Login (usuário padrão criado no bootstrap)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@your-company.com","password":"ChangeMe-Secure-Password-123!"}'

# 3. Monitorar ameaças (substitua TOKEN)
curl -X POST http://localhost:3000/threats/monitor \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"network":"192.168.1.0","cidr":24}'
```

### Via Postman / Insomnia

Importe as collections de [`postman/`](../postman/README.md). Execute **Login** primeiro — o token é salvo automaticamente no Postman.

---

## Comandos úteis

```bash
pnpm docker:up          # Build + sobe stack completa (app + infra)
pnpm docker:build       # Apenas build da imagem
pnpm docker:down        # Parar todos os containers
pnpm docker:logs        # Logs em tempo real
pnpm docker:ps          # Status dos containers
pnpm dev                # Dev local (hot-reload) — infra separada
```

---

## Troubleshooting

### `pnpm: command not found`

```bash
corepack enable
npm install -g pnpm
```

### Porta já em uso

Verifique processos nas portas 3000–3005 e 3100:

```bash
# Windows
netstat -ano | findstr :3000

# Linux / macOS
lsof -i :3000
```

### Docker não inicia / PostgreSQL connection refused

1. Confirme que Docker Desktop está rodando
2. Execute `pnpm docker:up` e aguarde healthchecks
3. Verifique `DATABASE_URL` no `.env`

### `JWT_ACCESS_SECRET` muito curto

Os secrets JWT devem ter no mínimo 32 caracteres em produção.

### Erro de módulo `@scandark/*` não encontrado

```bash
pnpm install
pnpm build   # compila packages compartilhados
```

### Frontend não conecta à API

Confirme `NEXT_PUBLIC_API_URL=http://localhost:3000` no `.env` e reinicie o frontend.

---

## Próximos passos

- [Arquitetura](./architecture.md) — entenda a estrutura do sistema
- [Desenvolvimento](./development.md) — workflow de contribuição
- [API Gateway](./api/gateway.md) — referência de endpoints
- [Testes](./testing.md) — como rodar e escrever testes
