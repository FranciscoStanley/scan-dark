# service-device-discovery

**Porta:** 3003 | **Swagger:** http://localhost:3003/docs

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/devices/fingerprint` | Classificar dispositivo |
| GET | `/devices` | Listar todos os dispositivos descobertos |
| GET | `/devices/scan/:scanId` | Dispositivos por scan |

Chamado automaticamente pelo `service-network-scan` após cada varredura concluída.

## Inventário deduplicado

Dispositivos são identificados por **MAC** (quando disponível) ou **IP**. Re-scans atualizam o registro existente (`lastSeen`, portas, risk score) em vez de criar duplicatas. O inventário só cresce quando um host genuinamente novo aparece na rede.

## Classificação

O `DeviceFingerprintEngine` identifica:

- **Câmeras** — RTSP (554), assinaturas Hikvision/Dahua/Reolink
- **Smart TVs** — Samsung, LG, Roku, FireTV
- **Roteadores** — TP-Link, Netgear, Asus, Mikrotik
- **Celulares** — HTTP proxy (8080)
- **IoT** — MQTT (1883), CoAP (5683)
- **NAS** — Synology, QNAP

## Risk Score

Calculado com base em portas perigosas expostas (Telnet, FTP, RDP, RTSP, UPnP).
