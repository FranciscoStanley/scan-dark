# Detecção de Ameaças

## Visão Geral

O `service-threat-detection` monitora a rede em busca de:

1. **Acessos indevidos a câmeras WiFi** — RTSP exposto, streams hijacked
2. **Acessos remotos não autorizados** — RDP, SSH brute-force
3. **Dispositivos não autorizados** — Novos hosts na rede
4. **Movimentação lateral** — Comprometimento em progresso
5. **Varreduras maliciosas** — Port scanning interno

## Fluxo de Detecção

```
Varredura TCP real / Evento de log → IntrusionDetectionEngine → Enriquecimento IP → Alerta no Dashboard
```

O monitoramento **não usa mais dados simulados**. O endpoint `POST /threats/monitor` executa varredura TCP na sub-rede informada e detecta portas de risco realmente abertas (RTSP, RDP, SSH, Telnet, SMB).

Eventos externos (firewall, IDS, syslog) devem ser enviados via `POST /threats/analyze` com o IP de origem real.

## Inteligência de IP

Cada ameaça inclui `sourceIpIntel` com:

| Campo | Descrição |
|-------|-----------|
| `country`, `city`, `region` | Geolocalização (IPs públicos) |
| `isp` | Provedor de internet |
| `organization` | Organização / proprietário do bloco IP |
| `asn` | Sistema autônomo (ASN) |
| `isPrivate` | `true` para IPs RFC 1918 (rede local) |

Consulta individual: `GET /threats/ip/:ip/intelligence`

Provedor padrão: [ipwho.is](https://ipwho.is) (sem API key). IPs privados são classificados localmente sem chamada externa.

## Ingestão de logs do firewall

Tentativas **externas** (RTSP/RDP/SSH vindos da internet) são detectadas via logs do firewall/roteador.

### Modo automático (arquivo)

```env
FIREWALL_LOG_ENABLED=true
FIREWALL_LOG_PATH=./logs/firewall.log
FIREWALL_LOG_POLL_MS=5000
```

Encaminhe os logs do roteador para o arquivo. Formatos suportados:

- **iptables:** `SRC=203.0.113.45 DST=192.168.1.100 DPT=554`
- **JSON:** `{"sourceIp":"198.51.100.22","targetIp":"192.168.1.50","targetPort":3389}`

No Docker, o volume `./logs` é montado em `/var/log/scandark/` e o serviço lê `firewall.log` automaticamente.

### Modo webhook

```bash
POST /threats/ingest
Authorization: Bearer <token>
Content-Type: application/json

{
  "lines": [
    "IN=wan SRC=203.0.113.45 DST=192.168.1.100 DPT=554"
  ]
}
```

Ou envie eventos estruturados via campo `events`. Opcionalmente defina `FIREWALL_INGEST_TOKEN` e envie o header `X-Ingest-Token`.

Status: `GET /threats/ingestion/status`

## Câmeras WiFi

### Cenários Detectados

| Cenário | Severidade | Ação |
|---------|------------|------|
| IP externo acessa RTSP | Critical | Bloquear + isolar VLAN |
| Dispositivo interno desconhecido acessa câmera | High | Verificar ACL |
| Stream RTSP sem autenticação | High | Habilitar auth |

### Remediação Padrão

1. Isolar câmeras em VLAN dedicada (IoT)
2. Desabilitar acesso RTSP externo no roteador
3. Alterar credenciais padrão
4. Atualizar firmware
5. Habilitar HTTPS no painel administrativo

## Acesso Remoto (RDP/SSH)

| Threshold | Valor |
|-----------|-------|
| Tentativas SSH falhas | 5 |
| Conexões RDP/minuto | 3 |

### Remediação

- Desabilitar RDP externo → usar VPN
- SSH: chaves públicas + fail2ban
- Habilitar MFA em todos os acessos remotos

## Monitoramento Contínuo

```bash
POST /threats/monitor
{ "network": "192.168.1.0", "cidr": 24 }
```

Executa varredura TCP real na sub-rede (máximo /24) e retorna ameaças com base em portas efetivamente abertas. Se nenhuma porta de risco estiver exposta, o dashboard exibirá "Nenhuma ameaça detectada" — comportamento esperado em redes seguras.

## Status de Ameaças

| Status | Descrição |
|--------|-----------|
| `active` | Ameaça em andamento |
| `investigating` | Em análise |
| `resolved` | Tratada |
| `false_positive` | Falso positivo |
