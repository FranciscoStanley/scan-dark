# service-network-scan

**Porta:** 3002 | **Swagger:** http://localhost:3002/docs

## Tipos de Scan

| Tipo | Descrição |
|------|-----------|
| `network_discovery` | Ping sweep + host discovery |
| `port_scan` | Varredura TCP de portas |
| `iot_fingerprint` | mDNS + SSDP + UPnP |
| `wifi_audit` | WPA2/WPA3, WPS, canais |
| `router_audit` | Painel admin, UPnP |
| `threat_monitor` | Monitoramento de ameaças |
| `full_assessment` | Todos combinados |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/scans` | Criar e iniciar scan |
| GET | `/scans` | Listar scans do usuário |
| GET | `/scans/:id` | Detalhes e resultados |

## Scanners

- `TcpNetworkScanner` — ICMP ping (sistema) + TCP connect; port scan nas portas de `@scandark/config`; reverse DNS
- `ProtocolDiscoveryService` — SSDP/UPnP real via UDP multicast; mDNS requer bind multicast no host
- `WifiAuditorService` — Indica requisitos de ferramentas WiFi do SO
- `RouterAuditorService` — Teste TCP nas portas 80/443/1900 do gateway

## Pós-scan

Ao concluir, o serviço chama `service-device-discovery` (`POST /devices/fingerprint`) para cada host ativo.

## Resposta `GET /scans/:id`

Inclui `results` com `hosts`, `aliveHosts`, `totalHostsScanned` e `durationMs`.

## Requisitos para scan real

Execute os serviços **na máquina conectada à LAN** (não em Docker bridge isolado). O scan usa `ping` do sistema e sockets TCP locais.
