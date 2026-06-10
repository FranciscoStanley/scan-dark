# Catálogo de Microserviços

Índice de todos os microserviços da plataforma ScanDark.

---

## Visão geral

| Serviço | Porta | Context | Documentação |
|---------|-------|---------|--------------|
| [service-api-gateway](../api/gateway.md) | 3000 | Gateway | Proxy + JWT |
| [service-auth](./service-auth.md) | 3001 | Identity | Autenticação RBAC |
| [service-network-scan](./service-network-scan.md) | 3002 | Reconnaissance | Varredura de rede |
| [service-device-discovery](./service-device-discovery.md) | 3003 | Reconnaissance | Fingerprint IoT |
| [service-vulnerability](./service-vulnerability.md) | 3004 | Risk Assessment | CVE e remediação |
| [service-threat-detection](./service-threat-detection.md) | 3005 | Threat Intel | Detecção de intrusões |

Swagger disponível em `http://localhost:{porta}/docs` para cada serviço.

---

## service-auth (:3001)

Autenticação JWT, registro, login, perfil. RBAC: `admin`, `analyst`, `viewer`.

→ [Documentação completa](./service-auth.md)

---

## service-network-scan (:3002)

Descoberta de hosts, varredura TCP, protocolos mDNS/SSDP/UPnP, auditoria WiFi e roteador.

**Tipos de scan:** `network_discovery`, `port_scan`, `iot_fingerprint`, `wifi_audit`, `router_audit`, `threat_monitor`, `full_assessment`

→ [Documentação completa](./service-network-scan.md)

---

## service-device-discovery (:3003)

Fingerprint e classificação de dispositivos: câmeras IP, Smart TVs, celulares, roteadores, IoT, NAS.

→ [Documentação completa](./service-device-discovery.md)

---

## service-vulnerability (:3004)

Motor de avaliação de vulnerabilidades com mapeamento CVE, severidade (Critical → Low) e recomendações de remediação.

→ [Documentação completa](./service-vulnerability.md)

---

## service-threat-detection (:3005)

Detecção de intrusões em tempo real: acesso indevido a câmeras WiFi (RTSP), RDP, SSH brute-force, dispositivos não autorizados, movimentação lateral.

→ [Documentação completa](./service-threat-detection.md) | [Guia de segurança](../security/threat-detection.md)

---

## service-api-gateway (:3000)

Proxy reverso unificado com validação JWT. Todas as requisições externas passam por aqui.

→ [Documentação API Gateway](../api/gateway.md)

---

## Comunicação

```
Cliente → Gateway (:3000) → Microserviço (:3001-3005)
```

Headers injetados pelo gateway:

| Header | Quando |
|--------|--------|
| `Authorization: Bearer <token>` | Todas as rotas protegidas |
| `x-user-id` | Rotas de scan (após validação JWT) |

---

## Collections de API

Cada serviço possui collection Postman/Insomnia:

→ [`postman/collections/`](../../postman/collections/)

---

## Referências

- [Arquitetura](../architecture.md)
- [API — Visão geral](../api/README.md)
- [Desenvolvimento](../development.md)
