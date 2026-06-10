# service-threat-detection

**Porta:** 3005 | **Swagger:** http://localhost:3005/docs

Motor de detecção de intrusões e monitoramento de ameaças em tempo real.

## Tipos de Ameaça

| Tipo | Descrição |
|------|-----------|
| `unauthorized_camera_access` | Acesso externo a câmera WiFi via RTSP |
| `rtsp_stream_hijack` | Acesso interno não autorizado a stream |
| `remote_desktop_intrusion` | Intrusão RDP detectada |
| `unauthorized_rdp` | Tentativa RDP de IP externo |
| `ssh_brute_force` | Ataque brute-force SSH |
| `port_scan_detected` | Varredura de portas na rede |
| `unauthorized_device` | Dispositivo desconhecido conectado |
| `lateral_movement` | Movimentação lateral entre hosts |
| `arp_spoofing` | Spoofing ARP detectado |
| `man_in_the_middle` | Ataque MITM |
| `data_exfiltration` | Exfiltração de dados |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/threats/analyze` | Analisar evento de rede real (logs, firewall) |
| POST | `/threats/monitor` | Varredura TCP real da sub-rede local |
| POST | `/threats/ingest` | Ingerir logs do firewall (webhook) |
| GET | `/threats/ingestion/status` | Status da ingestão automática |
| GET | `/threats/network/defaults` | Sub-rede padrão para monitoramento |
| GET | `/threats/ip/:ip/intelligence` | Geolocalização e proprietário do IP |
| GET | `/threats` | Todas as ameaças |
| GET | `/threats/active` | Ameaças ativas |
| GET | `/threats/stats` | Estatísticas |
| PATCH | `/threats/:id/resolve` | Resolver ameaça |

## Exemplo — Evento externo com inteligência de IP

```json
POST /threats/analyze
{
  "sourceIp": "203.0.113.45",
  "targetIp": "192.168.1.100",
  "targetPort": 554,
  "deviceType": "camera",
  "protocol": "rtsp",
  "eventType": "unauthorized_stream_access"
}
```

Resposta inclui `sourceIpIntel` com país, ISP, organização e ASN do IP de origem.

## Exemplo — Consultar IP

```bash
GET /threats/ip/8.8.8.8/intelligence
```

## Níveis de Acesso Monitorados

| Nível | Descrição |
|-------|-----------|
| `public` | Exposto à internet |
| `internal` | Apenas LAN |
| `restricted` | VLAN isolada |
| `critical` | Infraestrutura crítica (câmeras, roteador, NAS) |

→ Detalhes completos: [Threat Detection](../security/threat-detection.md)
