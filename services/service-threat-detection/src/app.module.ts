import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_CONFIG, DATABASE_SYNC } from '@scandark/config';
import { JwtAuthModule } from '@scandark/nest-auth';
import { ThreatDetectionController } from './presentation/controllers/threat-detection.controller';
import { IP_INTELLIGENCE_PROVIDER } from './domain/repositories/ip-intelligence.repository';
import { NETWORK_PROBE } from './domain/repositories/network-probe.repository';
import { THREAT_EVENT_REPOSITORY } from './domain/repositories/threat-event.repository';
import { HttpIpIntelligenceProvider } from './infrastructure/ip-intelligence/http-ip-intelligence.provider';
import { TcpNetworkProbe } from './infrastructure/network/tcp-network-probe';
import { LocalNetworkDetector } from './infrastructure/network/local-network.detector';
import { FirewallLogWatcher } from './infrastructure/ingestion/firewall-log.watcher';
import { TypeOrmThreatEventRepository } from './infrastructure/persistence/typeorm-threat-event.repository';
import { ThreatEventOrmEntity } from './infrastructure/persistence/threat-event.orm-entity';
import {
  AnalyzeThreatUseCase,
  ListThreatsUseCase,
  LookupIpIntelligenceUseCase,
  MonitorNetworkThreatsUseCase,
  ResolveThreatUseCase,
  GetNetworkDefaultsUseCase,
  IngestFirewallLogsUseCase,
  GetIngestionStatusUseCase,
} from './application/use-cases/threat-detection.use-cases';

@Module({
  imports: [
    JwtAuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: DATABASE_CONFIG.URL,
      entities: [ThreatEventOrmEntity],
      synchronize: DATABASE_SYNC,
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([ThreatEventOrmEntity]),
  ],
  controllers: [ThreatDetectionController],
  providers: [
    LocalNetworkDetector,
    FirewallLogWatcher,
    { provide: IP_INTELLIGENCE_PROVIDER, useClass: HttpIpIntelligenceProvider },
    { provide: NETWORK_PROBE, useClass: TcpNetworkProbe },
    { provide: THREAT_EVENT_REPOSITORY, useClass: TypeOrmThreatEventRepository },
    {
      provide: LookupIpIntelligenceUseCase,
      useFactory: (ipIntel: HttpIpIntelligenceProvider) =>
        new LookupIpIntelligenceUseCase(ipIntel),
      inject: [IP_INTELLIGENCE_PROVIDER],
    },
    {
      provide: AnalyzeThreatUseCase,
      useFactory: (ipIntel: HttpIpIntelligenceProvider, repo: TypeOrmThreatEventRepository) =>
        new AnalyzeThreatUseCase(ipIntel, repo),
      inject: [IP_INTELLIGENCE_PROVIDER, THREAT_EVENT_REPOSITORY],
    },
    {
      provide: MonitorNetworkThreatsUseCase,
      useFactory: (
        probe: TcpNetworkProbe,
        ipIntel: HttpIpIntelligenceProvider,
        repo: TypeOrmThreatEventRepository,
      ) => new MonitorNetworkThreatsUseCase(probe, ipIntel, repo),
      inject: [NETWORK_PROBE, IP_INTELLIGENCE_PROVIDER, THREAT_EVENT_REPOSITORY],
    },
    {
      provide: ListThreatsUseCase,
      useFactory: (repo: TypeOrmThreatEventRepository) => new ListThreatsUseCase(repo),
      inject: [THREAT_EVENT_REPOSITORY],
    },
    {
      provide: ResolveThreatUseCase,
      useFactory: (repo: TypeOrmThreatEventRepository) => new ResolveThreatUseCase(repo),
      inject: [THREAT_EVENT_REPOSITORY],
    },
    {
      provide: GetNetworkDefaultsUseCase,
      useFactory: (detector: LocalNetworkDetector) => new GetNetworkDefaultsUseCase(detector),
      inject: [LocalNetworkDetector],
    },
    {
      provide: IngestFirewallLogsUseCase,
      useFactory: (analyze: AnalyzeThreatUseCase) => new IngestFirewallLogsUseCase(analyze),
      inject: [AnalyzeThreatUseCase],
    },
    {
      provide: GetIngestionStatusUseCase,
      useFactory: (ingest: IngestFirewallLogsUseCase, watcher: FirewallLogWatcher) =>
        new GetIngestionStatusUseCase(ingest, watcher),
      inject: [IngestFirewallLogsUseCase, FirewallLogWatcher],
    },
  ],
})
export class AppModule {}
