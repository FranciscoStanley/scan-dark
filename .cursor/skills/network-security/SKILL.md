---
name: scandark-network-security
description: >-
  Domínio de segurança de rede do ScanDark. Use ao implementar scanners,
  detecção de ameaças, fingerprint de dispositivos ou avaliação de vulnerabilidades.
---

# Segurança de Rede — ScanDark

## Serviços por Domínio

| Domínio | Service | Responsabilidade |
|---------|---------|-----------------|
| Reconnaissance | service-network-scan | Host discovery, port scan |
| Fingerprint | service-device-discovery | Classificação de devices |
| Risk | service-vulnerability | CVE, severidade, remediação |
| Threat | service-threat-detection | Intrusões, câmeras, RDP, SSH |

## Ameaças Monitoradas

- Acesso externo a câmeras RTSP (porta 554)
- RDP/SSH brute-force
- Dispositivos não autorizados
- Movimentação lateral
- Port scanning malicioso

## Portas Críticas

Definidas em `@scandark/config` → `COMMON_PORTS` e `THREAT_THRESHOLDS`

## Extensão de Scanner

1. Interface em `domain/repositories/`
2. Implementação em `infrastructure/scanners/`
3. Registrar provider no Module
4. Testes Vitest com mocks de rede

## Referência

- `docs/security/threat-detection.md`
- `docs/services/service-threat-detection.md`
