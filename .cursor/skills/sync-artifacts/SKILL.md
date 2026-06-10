---
name: sync-artifacts
description: >-
  Garante que Swagger, testes e documentação permaneçam sincronizados com
  alterações de código. Use ao implementar ou modificar funcionalidades,
  arquitetura, endpoints, bootstrap, variáveis de ambiente, contratos ou
  qualquer mudança relevante no monorepo ScanDark.
---

# Sync Artifacts — Swagger, Testes e Documentação

## Regra obrigatória

**Sempre que alterar funcionalidades, arquitetura ou qualquer coisa relevante no código**, atualize na mesma entrega:

1. **Swagger** — decorators e descrições nos controllers; `DocumentBuilder` em `main.ts` se o comportamento do serviço mudou
2. **Testes** — unitários (use cases, engines, proxy) cobrindo o comportamento novo ou corrigido
3. **Documentação** — arquivos em `docs/`, `.env.example`, collections Postman/Insomnia quando aplicável

Não finalize a tarefa sem verificar os três pilares.

---

## Checklist por tipo de mudança

### Novo ou alterado endpoint REST

- [ ] DTO em `packages/contracts/`
- [ ] `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth` no controller
- [ ] Teste do use case (mínimo: sucesso + erro principal)
- [ ] `docs/services/service-{nome}.md` e `docs/api/gateway.md` (se exposto no gateway)
- [ ] Collection em `postman/collections/`

### Nova variável de ambiente ou bootstrap

- [ ] Constante em `packages/config/src/index.ts`
- [ ] `.env.example`
- [ ] `docs/environment-variables.md`
- [ ] `docs/getting-started.md` (se impacta primeiro acesso)
- [ ] `docker-compose.yml` (se infraestrutura)

### Mudança de arquitetura ou fluxo entre serviços

- [ ] `docs/architecture.md` ou `docs/api/gateway.md`
- [ ] Teste de integração/proxy quando houver encaminhamento de headers ou contratos
- [ ] Swagger com descrição do fluxo quando não for óbvio

### Correção de bug

- [ ] Teste de regressão que falharia antes do fix
- [ ] Doc apenas se o comportamento documentado estava errado

---

## Onde atualizar (mapa rápido)

| Artefato | Local |
|----------|-------|
| Swagger runtime | `services/*/src/main.ts`, decorators nos controllers |
| Auth compartilhado | `packages/nest-auth/` — guards reutilizáveis |
| Migrations DB | `database/migrations/` |
| Testes | `*.spec.ts` colocado ao lado do código ou em `test/` |
| Serviço | `docs/services/service-*.md` |
| API / Gateway | `docs/api/README.md`, `docs/api/gateway.md` |
| Ambiente | `docs/environment-variables.md`, `.env.example` |
| Onboarding | `docs/getting-started.md`, `docs/README.md`, `README.md` |
| Collections | `postman/collections/`, `postman/environments/` |
| Testes (guia) | `docs/testing.md` |

---

## Validação antes de concluir

```bash
pnpm test                    # suíte completa
pnpm --filter <service> build  # compila o serviço alterado
```

Confirme manualmente se a mudança afeta:
- credenciais ou URLs de exemplo na documentação
- exemplos cURL e Postman
- descrições Swagger visíveis em `/docs`

---

## Anti-padrões

- ❌ Código mergeado sem teste para comportamento novo
- ❌ Endpoint público sem `@ApiOperation` / `@ApiResponse`
- ❌ Variável de ambiente só no código, sem `.env.example`
- ❌ Exemplo desatualizado em `docs/` ou Postman (ex.: credenciais antigas)
- ❌ Assumir que Swagger “se regenera sozinho” — decorators e descrições são responsabilidade do desenvolvedor
