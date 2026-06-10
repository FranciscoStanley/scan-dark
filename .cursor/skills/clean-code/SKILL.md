---
name: scandark-clean-code
description: >-
  Clean Code e boas práticas de desenvolvimento para ScanDark. Use ao escrever
  código TypeScript, nomes, funções, testes ou revisar PRs.
---

# Clean Code — ScanDark

## Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Use case | `{Verbo}{Entidade}UseCase` | `CreateNetworkScanUseCase` |
| Entity | Substantivo singular | `ThreatEvent`, `NetworkDevice` |
| Interface | `I` + substantivo | `IUserRepository` |
| DTO | `{Ação}Dto` / `{Entidade}Response` | `CreateScanDto`, `ThreatEventResponse` |
| Token DI | `UPPER_SNAKE` Symbol | `USER_REPOSITORY` |

## Funções

- Máximo ~30 linhas por função
- Um nível de abstração por função
- Evitar flag arguments — preferir métodos separados
- Early return em vez de nesting profundo

```typescript
// ✅ Early return
async execute(id: string): Promise<Result<User>> {
  const user = await this.repo.findById(id);
  if (!user) return Result.fail(new NotFoundError('User', id));
  return Result.ok(user);
}
```

## Comentários

- Código autoexplicativo > comentários
- Comentar apenas regras de negócio não óbvias
- Nunca comentar o que o código já diz

## Testes (Vitest)

- Um describe por use case / engine
- Mocks via interfaces, não classes concretas
- Nomear: `should {comportamento} when {condição}`

## Formatação

- Prettier com single quotes, trailing commas
- Imports: externos → packages → relativos
- Sem `any` — usar tipos explícitos
