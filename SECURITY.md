# Política de Segurança

## Uso responsável

O ScanDark é uma ferramenta de **auditoria de segurança de rede**. Seu uso deve estar em conformidade com leis locais e políticas organizacionais.

> **Aviso legal:** Execute scans e testes de intrusão **somente em redes que você possui ou possui autorização explícita por escrito** para testar. O uso não autorizado pode ser ilegal.

---

## Escopo de segurança do projeto

Esta política cobre vulnerabilidades no **código-fonte e infraestrutura do ScanDark**, não vulnerabilidades descobertas em redes auditadas pela ferramenta.

---

## Versões suportadas

| Versão | Suporte |
|--------|---------|
| `1.x` (main) | Ativo |

---

## Reportar uma vulnerabilidade

**Não abra issues públicas para vulnerabilidades de segurança.**

Envie um reporte privado com:

1. Descrição da vulnerabilidade
2. Passos para reproduzir
3. Impacto potencial (confidencialidade, integridade, disponibilidade)
4. Versão/commit afetado
5. Sugestão de correção (opcional)

**Canal:** abra um [Security Advisory](https://docs.github.com/en/code-security/security-advisories) no GitHub ou envie e-mail para o mantenedor do repositório (configure antes de publicar).

---

## O que reportar

| Categoria | Exemplos |
|-----------|----------|
| Autenticação | Bypass JWT, escalação de privilégios RBAC |
| Injeção | SQL injection, command injection em scanners |
| Exposição de dados | Vazamento de credenciais, tokens em logs |
| Configuração | Secrets padrão em produção, CORS permissivo |
| Dependências | CVEs críticas em dependências diretas |

---

## O que **não** reportar

- Resultados de scans em redes de terceiros
- Vulnerabilidades em dispositivos IoT descobertos pela ferramenta (reporte ao fabricante)
- Issues de hardening em ambientes de desenvolvimento local com credenciais padrão documentadas

---

## Boas práticas para deploy

Antes de expor o ScanDark em produção:

| Item | Recomendação |
|------|--------------|
| JWT secrets | Gerar valores aleatórios ≥ 32 caracteres |
| PostgreSQL | Senha forte, acesso restrito por rede |
| CORS | Limitar a domínios conhecidos |
| HTTPS | Terminar TLS no reverse proxy |
| RBAC | Princípio do menor privilégio |
| Logs | Não registrar tokens ou senhas |
| Scans | Restringir a redes autorizadas via firewall |

Referência: [`docs/environment-variables.md`](./docs/environment-variables.md) e [`docs/deployment.md`](./docs/deployment.md)

---

## Tempo de resposta

| Severidade | SLA alvo |
|------------|----------|
| Critical | 48 horas (acknowledgment) |
| High | 7 dias |
| Medium / Low | Próximo ciclo de release |

---

## Divulgação coordenada

Preferimos divulgação coordenada. Após correção, publicaremos um advisory com créditos ao reporter (se desejado).
