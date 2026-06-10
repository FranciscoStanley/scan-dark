# Guia de Contribuição

Obrigado por considerar contribuir com o ScanDark. Este documento descreve o fluxo de trabalho, padrões de código e expectativas para pull requests.

---

## Código de conduta

- Seja respeitoso e construtivo em issues e PRs
- Não use a plataforma para atividades ilegais ou scans não autorizados
- Reporte vulnerabilidades de segurança conforme [`SECURITY.md`](./SECURITY.md)

---

## Como contribuir

### 1. Reportar bugs

Abra uma **issue** com:

- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs. observado
- Ambiente (OS, Node.js, pnpm, Docker)
- Logs ou screenshots quando aplicável

### 2. Sugerir melhorias

Use issues com label `enhancement`. Descreva o caso de uso e o benefício esperado.

### 3. Enviar código

```bash
git checkout -b feat/minha-feature
# ou fix/correcao-descricao
```

---

## Setup de desenvolvimento

```bash
git clone <seu-fork>
cd scan-dark
pnpm install
cp .env.example .env
pnpm docker:up
pnpm dev
```

Documentação completa: [`docs/development.md`](./docs/development.md)

---

## Padrões de código

### Arquitetura

Cada microserviço segue **Clean Architecture**:

| Camada | Responsabilidade |
|--------|------------------|
| `domain/` | Entidades, interfaces, regras puras — zero dependências externas |
| `application/` | Use cases — orquestração de negócio |
| `infrastructure/` | TypeORM, scanners, JWT, messaging |
| `presentation/` | Controllers, guards, strategies (NestJS) |

### SOLID

- **Um use case = uma ação de negócio** (Single Responsibility)
- Dependências via **interfaces e Symbol tokens** (Dependency Inversion)
- Extensão por novas implementações, não modificação de código existente (Open/Closed)

### TypeScript

- Tipagem estrita — evite `any`
- DTOs compartilhados em `@scandark/contracts`
- Enums e tipos de domínio em `@scandark/shared-kernel`

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(threat-detection): add lateral movement detection
fix(auth): validate email format on register
docs(readme): update quick start instructions
test(vulnerability): add RTSP exposure tests
refactor(gateway): extract proxy headers helper
```

### Testes

- Novos use cases devem incluir testes unitários (Vitest)
- Execute `pnpm test` antes de abrir o PR
- Coverage não deve regredir significativamente

```bash
pnpm test
pnpm test:cov
pnpm lint
pnpm build
```

---

## Estrutura de Pull Request

### Título

```
feat(service-auth): implement refresh token rotation
```

### Descrição

```markdown
## Resumo
Breve descrição do que foi feito e por quê.

## Tipo de mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada (se aplicável)
- [ ] `pnpm test` passa localmente
- [ ] `pnpm build` passa localmente
```

---

## Escopo por área

| Diretório | Guidelines |
|-----------|------------|
| `services/service-*` | Clean Architecture, Swagger decorators, Vitest |
| `packages/*` | Sem dependências de framework; apenas tipos e utilitários |
| `frontend/` | App Router, componentes em `components/ui`, API via `@/lib/api` |
| `docs/` | Markdown claro, links relativos, exemplos testáveis |
| `postman/` | Manter collections sincronizadas com controllers |

---

## Revisão de código

PRs serão avaliados quanto a:

1. Correção funcional
2. Aderência à arquitetura
3. Cobertura de testes
4. Clareza e manutenibilidade
5. Impacto em segurança (especialmente em scanners e threat detection)

---

## Dúvidas

Abra uma issue com a label `question` ou consulte a [documentação](./docs/README.md).
