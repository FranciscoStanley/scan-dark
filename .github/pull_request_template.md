---
name: Pull Request
about: Template para pull requests
title: ''
labels: ''
assignees: ''
---

## Resumo

<!-- Descreva o que foi feito e por quê -->

## Tipo de mudança

- [ ] Bug fix (correção não-breaking)
- [ ] Nova feature (mudança não-breaking que adiciona funcionalidade)
- [ ] Breaking change (correção ou feature que quebra compatibilidade)
- [ ] Documentação
- [ ] Refatoração

## Serviços afetados

- [ ] service-api-gateway
- [ ] service-auth
- [ ] service-network-scan
- [ ] service-device-discovery
- [ ] service-vulnerability
- [ ] service-threat-detection
- [ ] frontend
- [ ] packages compartilhados
- [ ] docs / CI

## Checklist

- [ ] `pnpm test` passa localmente
- [ ] `pnpm build` passa localmente
- [ ] Documentação atualizada (se aplicável)
- [ ] Collections Postman atualizadas (se endpoints mudaram)
- [ ] Sem secrets ou credenciais no código

## Screenshots (se UI)

<!-- Adicione screenshots do frontend se aplicável -->

## Issue relacionada

Closes #
