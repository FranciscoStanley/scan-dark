---
name: scandark-solid-principles
description: >-
  Princípios SOLID para desenvolvimento no ScanDark. Use ao revisar código,
  criar classes, interfaces ou refatorar microserviços.
---

# SOLID — ScanDark

## S — Single Responsibility

Cada classe tem uma razão para mudar.

```typescript
// ✅ Um use case = uma ação
class RegisterUserUseCase { /* apenas registro */ }
class LoginUserUseCase { /* apenas login */ }

// ❌ God class
class AuthService { register() login() resetPassword() sendEmail() }
```

## O — Open/Closed

Extensível sem modificar código existente.

```typescript
// ✅ Nova estratégia de scan via interface
interface INetworkScanner {
  discoverHosts(network: string, cidr: number): Promise<Host[]>;
}
// TcpNetworkScanner, NmapNetworkScanner — plugáveis
```

## L — Liskov Substitution

Implementações substituíveis sem quebrar contratos.

```typescript
// TypeOrmUserRepository e InMemoryUserRepository implementam IUserRepository
// Use cases funcionam com qualquer implementação
```

## I — Interface Segregation

Interfaces pequenas e focadas.

```typescript
// ✅ Segregado
interface IWifiAuditor { audit(): Promise<WifiAuditResult>; }
interface IRouterAuditor { audit(gatewayIp: string): Promise<RouterAuditResult>; }

// ❌ Interface gorda
interface INetworkAuditor { auditWifi(); auditRouter(); scanPorts(); fingerprint(); }
```

## D — Dependency Inversion

Depender de abstrações, não de implementações.

```typescript
// Module provider
{
  provide: RegisterUserUseCase,
  useFactory: (repo: IUserRepository, hasher: IPasswordHasher) =>
    new RegisterUserUseCase(repo, hasher),
  inject: [USER_REPOSITORY, PASSWORD_HASHER],
}
```
