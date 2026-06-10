# Frontend — frontend/

**Porta:** 3100 | **Framework:** Next.js 15 App Router

## Estrutura

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/                # Autenticação
│   ├── register/
│   └── dashboard/            # Área autenticada
│       ├── page.tsx          # Overview
│       ├── threats/          # Monitoramento de ameaças
│       ├── scans/            # Gerenciamento de scans
│       ├── devices/          # Dispositivos descobertos
│       ├── vulnerabilities/  # CVEs e riscos
│       └── license/          # Licença comercial
├── components/
│   ├── layout/               # Sidebar, Header
│   └── ui/                   # Design system
├── contexts/                 # Auth context
└── lib/api.ts                # API client
```

## Design System

- **Tema:** Dark com glassmorphism
- **Cores:** Emerald (seguro), Red (crítico), Amber (alerta)
- **Tipografia:** Inter (UI) + JetBrains Mono (dados técnicos)
- **Componentes:** Card, StatCard, Badge, Button, Sidebar

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page marketing |
| `/login` | Login |
| `/register` | Registro |
| `/dashboard` | Overview — scans, devices, stats |
| `/dashboard/threats` | Monitor de ameaças em tempo real |
| `/dashboard/scans` | Criar e acompanhar scans de rede |
| `/dashboard/devices` | Inventário de dispositivos |
| `/dashboard/vulnerabilities` | Vulnerabilidades por scan |
| `/dashboard/license` | Status e ativação de licença (admin) |

## API Client

Todas as chamadas passam pelo gateway (`NEXT_PUBLIC_API_URL`):

```typescript
import { api } from '@/lib/api';

await api.login(email, password);
await api.monitorThreats('192.168.1.0');
await api.listActiveThreats();
```

## Variáveis

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```
