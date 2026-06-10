# service-auth

Microserviço de autenticação e autorização — registro, login JWT e controle de acesso baseado em roles (RBAC).

| | |
|---|---|
| **Porta** | 3001 |
| **Swagger** | http://localhost:3001/docs |
| **Diretório** | `services/service-auth` |
| **Bounded Context** | Identity |

---

## Responsabilidades

- Registro e autenticação de usuários
- Emissão e validação de JWT (access + refresh tokens)
- Perfil do usuário autenticado
- RBAC: `admin`, `analyst`, `viewer`
- Bootstrap de usuário admin padrão na inicialização

---

## Usuário padrão (bootstrap)

Na inicialização do serviço, um usuário admin é criado **automaticamente** se ainda não existir no banco. O processo é **idempotente** — reinícios subsequentes não duplicam o usuário.

| Campo | Valor padrão (dev) |
|-------|-------------------|
| Nome | Administrator |
| Email | admin@your-company.com |
| Senha | ChangeMe-Secure-Password-123! |
| Role | `admin` |

Configurável via variáveis de ambiente (ver [environment-variables.md](../environment-variables.md)):

| Variável | Descrição |
|----------|-----------|
| `DEFAULT_USER_ENABLED` | `false` desabilita o bootstrap (padrão: habilitado) |
| `DEFAULT_USER_EMAIL` | Email do usuário padrão |
| `DEFAULT_USER_PASSWORD` | Senha do usuário padrão |
| `DEFAULT_USER_NAME` | Nome completo |
| `DEFAULT_USER_ROLE` | Role (`admin`, `analyst`, `viewer`) |

> **Produção:** altere email e senha via variáveis de ambiente ou defina `DEFAULT_USER_ENABLED=false` após criar usuários reais.

---

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | — | Registrar novo usuário |
| POST | `/auth/login` | — | Autenticar e receber tokens |
| GET | `/auth/profile` | JWT | Perfil do usuário logado |

### POST `/auth/register`

```json
{
  "email": "novo@exemplo.com",
  "password": "SecurePass123!",
  "name": "Novo Usuário",
  "role": "analyst"
}
```

**Roles válidas:** `admin`, `analyst`, `viewer`

### POST `/auth/login`

Use o usuário padrão criado no bootstrap ou qualquer conta registrada:

```json
{
  "email": "admin@your-company.com",
  "password": "ChangeMe-Secure-Password-123!"
}
```

**Resposta:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}
```

---

## Clean Architecture

```
src/
├── domain/
│   ├── entities/user.entity.ts
│   └── repositories/user.repository.ts      # IUserRepository (port)
├── application/
│   └── use-cases/
│       ├── auth.use-cases.ts                # Register, Login, GetProfile
│       └── ensure-default-user.use-case.ts  # Bootstrap idempotente
├── infrastructure/
│   ├── bootstrap/default-user.bootstrap.ts  # OnModuleInit
│   ├── persistence/typeorm-user.repository.ts
│   └── security/jwt-token.service.ts
└── presentation/
    ├── controllers/auth.controller.ts
    ├── guards/jwt-auth.guard.ts
    └── strategies/jwt.strategy.ts
```

---

## RBAC

| Role | Permissões |
|------|------------|
| `admin` | Gerenciamento completo — usuários, scans, ameaças |
| `analyst` | Criar scans, analisar ameaças, resolver alertas |
| `viewer` | Visualização de dashboards e relatórios |

---

## Persistência

- **PostgreSQL** via TypeORM
- Entidade: `User` (id, email, passwordHash, name, role, createdAt)

Variável: `DATABASE_URL`

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_ACCESS_SECRET` | Secret do access token |
| `JWT_REFRESH_SECRET` | Secret do refresh token |
| `DEFAULT_USER_ENABLED` | Habilita bootstrap do usuário padrão |
| `DEFAULT_USER_EMAIL` | Email do usuário padrão |
| `DEFAULT_USER_PASSWORD` | Senha do usuário padrão |
| `DEFAULT_USER_NAME` | Nome do usuário padrão |
| `DEFAULT_USER_ROLE` | Role do usuário padrão |

---

## Referências

- [API Gateway](../api/gateway.md)
- [Variáveis de ambiente](../environment-variables.md)
- Collection: [`postman/collections/service-auth.postman_collection.json`](../../postman/collections/service-auth.postman_collection.json)
