# ScanDark — API Collections

Collections para **Postman** e **Insomnia** de todos os microserviços.

Parte da [documentação oficial](../docs/README.md) do projeto.

**Autor:** Francisco Stanley Rodrigues Albuquerque

## Estrutura

```
postman/
├── environments/
│   └── scandark-local.postman_environment.json
├── collections/
│   ├── scandark-api-gateway.postman_collection.json      # Via gateway (:3000)
│   ├── service-auth.postman_collection.json                # Direto (:3001)
│   ├── service-network-scan.postman_collection.json        # Direto (:3002)
│   ├── service-device-discovery.postman_collection.json    # Direto (:3003)
│   ├── service-vulnerability.postman_collection.json       # Direto (:3004)
│   └── service-threat-detection.postman_collection.json    # Direto (:3005)
└── insomnia/
    └── scandark-workspace.insomnia.json                    # Workspace completo
```

## Postman

1. **Import** → selecione os arquivos em `postman/collections/`
2. Importe o environment `postman/environments/scandark-local.postman_environment.json`
3. Selecione o environment **ScanDark — Local**
4. Execute **Auth → Login** (salva o token automaticamente)
5. Use os demais endpoints

## Insomnia

### Opção A — Importar collections Postman (recomendado)

1. **Application → Import/Export → Import Data**
2. Selecione os `.postman_collection.json` de `postman/collections/`
3. Crie um Environment com as variáveis do arquivo de environment Postman

### Opção B — Workspace nativo

1. Importe `postman/insomnia/scandark-workspace.insomnia.json`
2. Ative o environment **ScanDark Local**
3. Execute **01 Auth → Login** primeiro

## Fluxo recomendado

O **service-auth** cria um usuário admin automaticamente na inicialização (padrão: `admin@your-company.com`). Configure `DEFAULT_USER_*` no `.env` e alinhe o environment Postman (`userEmail` / `userPassword`).

```
1. Login          → salva accessToken (usuário padrão já existe)
3. Create Scan    → salva scanId
4. Fingerprint    → salva deviceId
5. Assess Vuln
6. Monitor Threats → salva threatId
7. Resolve Threat
```

## URLs dos serviços

| Serviço | Porta | Collection |
|---------|-------|--------------|
| API Gateway | 3000 | `scandark-api-gateway` |
| service-auth | 3001 | `service-auth` |
| service-network-scan | 3002 | `service-network-scan` |
| service-device-discovery | 3003 | `service-device-discovery` |
| service-vulnerability | 3004 | `service-vulnerability` |
| service-threat-detection | 3005 | `service-threat-detection` |
