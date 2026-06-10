# ScanDark monorepo — build único, múltiplos serviços via docker-compose
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat curl iputils-ping
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# --- deps: cache layer de dependências ---
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

COPY packages/shared-kernel/package.json packages/shared-kernel/
COPY packages/contracts/package.json packages/contracts/
COPY packages/config/package.json packages/config/

COPY services/service-api-gateway/package.json services/service-api-gateway/
COPY services/service-auth/package.json services/service-auth/
COPY services/service-network-scan/package.json services/service-network-scan/
COPY services/service-device-discovery/package.json services/service-device-discovery/
COPY services/service-vulnerability/package.json services/service-vulnerability/
COPY services/service-threat-detection/package.json services/service-threat-detection/

COPY frontend/package.json frontend/

RUN pnpm install --frozen-lockfile

# --- builder: compila packages + services + frontend ---
FROM base AS builder

ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Recria symlinks dos workspaces após copiar o código-fonte
RUN pnpm install --frozen-lockfile

RUN pnpm build

# --- runner: imagem final compartilhada por todos os serviços ---
FROM base AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services ./services
COPY --from=builder /app/frontend ./frontend

# Next.js standalone (monorepo) — public/ pode estar vazio
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 3000 3001 3002 3003 3004 3005 3100
