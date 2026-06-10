import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_CONFIG, DATABASE_SYNC } from '@scandark/config';
import { JwtAuthModule } from '@scandark/nest-auth';
import {
  CreateNetworkScanUseCase,
  GetNetworkScanUseCase,
  ListNetworkScansUseCase,
} from './application/use-cases/network-scan.use-cases';
import {
  NETWORK_SCAN_REPOSITORY,
  NETWORK_SCANNER,
  PROTOCOL_DISCOVERY,
  WIFI_AUDITOR,
  ROUTER_AUDITOR,
} from './domain/repositories/network-scan.repository';
import { NetworkScanOrmEntity } from './infrastructure/persistence/network-scan.orm-entity';
import { TypeOrmNetworkScanRepository } from './infrastructure/persistence/typeorm-network-scan.repository';
import {
  TcpNetworkScanner,
  ProtocolDiscoveryService,
  WifiAuditorService,
  RouterAuditorService,
} from './infrastructure/scanners/network-scanner.impl';
import {
  DEVICE_DISCOVERY_CLIENT,
  HttpDeviceDiscoveryClient,
} from './infrastructure/clients/device-discovery.client';
import {
  VULNERABILITY_CLIENT,
  HttpVulnerabilityClient,
} from './infrastructure/clients/vulnerability.client';
import { NetworkScanController } from './presentation/controllers/network-scan.controller';

@Module({
  imports: [
    JwtAuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: DATABASE_CONFIG.URL,
      entities: [NetworkScanOrmEntity],
      synchronize: DATABASE_SYNC,
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([NetworkScanOrmEntity]),
  ],
  controllers: [NetworkScanController],
  providers: [
    { provide: NETWORK_SCAN_REPOSITORY, useClass: TypeOrmNetworkScanRepository },
    { provide: NETWORK_SCANNER, useClass: TcpNetworkScanner },
    { provide: PROTOCOL_DISCOVERY, useClass: ProtocolDiscoveryService },
    { provide: WIFI_AUDITOR, useClass: WifiAuditorService },
    { provide: ROUTER_AUDITOR, useClass: RouterAuditorService },
    { provide: DEVICE_DISCOVERY_CLIENT, useClass: HttpDeviceDiscoveryClient },
    { provide: VULNERABILITY_CLIENT, useClass: HttpVulnerabilityClient },
    {
      provide: CreateNetworkScanUseCase,
      useFactory: (
        repo: TypeOrmNetworkScanRepository,
        scanner: TcpNetworkScanner,
        protocol: ProtocolDiscoveryService,
        wifi: WifiAuditorService,
        router: RouterAuditorService,
        deviceDiscovery: HttpDeviceDiscoveryClient,
        vulnerability: HttpVulnerabilityClient,
      ) =>
        new CreateNetworkScanUseCase(
          repo,
          scanner,
          protocol,
          wifi,
          router,
          deviceDiscovery,
          vulnerability,
        ),
      inject: [
        NETWORK_SCAN_REPOSITORY,
        NETWORK_SCANNER,
        PROTOCOL_DISCOVERY,
        WIFI_AUDITOR,
        ROUTER_AUDITOR,
        DEVICE_DISCOVERY_CLIENT,
        VULNERABILITY_CLIENT,
      ],
    },
    {
      provide: GetNetworkScanUseCase,
      useFactory: (repo: TypeOrmNetworkScanRepository) => new GetNetworkScanUseCase(repo),
      inject: [NETWORK_SCAN_REPOSITORY],
    },
    {
      provide: ListNetworkScansUseCase,
      useFactory: (repo: TypeOrmNetworkScanRepository) => new ListNetworkScansUseCase(repo),
      inject: [NETWORK_SCAN_REPOSITORY],
    },
  ],
})
export class NetworkScanModule {}
