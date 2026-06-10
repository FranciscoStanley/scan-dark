# Screenshots — Interface ScanDark

Imagens usadas no [README](../../README.md) e na documentação.

## Regenerar

Com o frontend em execução (`pnpm --filter @scandark/web dev`):

```bash
node scripts/capture-screenshots.mjs
```

Variáveis opcionais:

- `SCREENSHOT_BASE_URL` — frontend (padrão: `http://localhost:3100`)
- `SCREENSHOT_API_URL` — API mockada pelo Playwright (padrão: `http://localhost:3000`)

Os mocks interceptam **somente** chamadas à API (`localhost:3000`), nunca as rotas do Next.js (`/dashboard/*`).
