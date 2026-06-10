import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  NotFoundException,
  UnauthorizedException,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiHeader } from '@nestjs/swagger';
import {
  AnalyzeThreatDto,
  ThreatEventResponse,
  ThreatStatsResponse,
  MonitorNetworkDto,
  IpIntelligenceResponse,
  NetworkDefaultsResponse,
  IngestFirewallLogsDto,
  IngestionStatusResponse,
  IngestFirewallLogsResponse,
} from '@scandark/contracts';
import { FIREWALL_LOG_CONFIG } from '@scandark/config';
import { CurrentUser, AuthenticatedUser, InternalOrJwtGuard } from '@scandark/nest-auth';
import { ThreatStatus } from '@scandark/shared-kernel';
import { ThreatEvent } from '../../domain/entities/threat-event.entity';
import {
  AnalyzeThreatUseCase,
  ListThreatsUseCase,
  LookupIpIntelligenceUseCase,
  MonitorNetworkThreatsUseCase,
  ResolveThreatUseCase,
  EnrichedThreatEvent,
  GetNetworkDefaultsUseCase,
  IngestFirewallLogsUseCase,
  GetIngestionStatusUseCase,
} from '../../application/use-cases/threat-detection.use-cases';
import { IpIntelligence } from '../../domain/value-objects/ip-intelligence.vo';

@ApiTags('Threat Detection')
@Controller('threats')
@UseGuards(InternalOrJwtGuard)
@ApiBearerAuth()
export class ThreatDetectionController {
  constructor(
    private readonly analyzeThreat: AnalyzeThreatUseCase,
    private readonly monitorNetwork: MonitorNetworkThreatsUseCase,
    private readonly listThreats: ListThreatsUseCase,
    private readonly resolveThreat: ResolveThreatUseCase,
    private readonly lookupIp: LookupIpIntelligenceUseCase,
    private readonly getNetworkDefaults: GetNetworkDefaultsUseCase,
    private readonly ingestLogs: IngestFirewallLogsUseCase,
    private readonly getIngestionStatus: GetIngestionStatusUseCase,
  ) {}

  @Get('network/defaults')
  @ApiOperation({ summary: 'Obter sub-rede padrão para monitoramento' })
  @ApiResponse({ status: 200, type: NetworkDefaultsResponse })
  networkDefaults(): NetworkDefaultsResponse {
    const defaults = this.getNetworkDefaults.execute();
    return {
      network: defaults.network,
      cidr: defaults.cidr,
      source: defaults.source,
      interfaceName: defaults.interfaceName,
    };
  }

  @Get('ingestion/status')
  @ApiOperation({ summary: 'Status da ingestão automática de logs do firewall' })
  @ApiResponse({ status: 200, type: IngestionStatusResponse })
  ingestionStatus(): IngestionStatusResponse {
    return this.getIngestionStatus.execute();
  }

  @Post('ingest')
  @ApiOperation({ summary: 'Ingerir logs do firewall (webhook ou syslog encaminhado)' })
  @ApiHeader({ name: 'x-ingest-token', required: false })
  @ApiResponse({ status: 201, type: IngestFirewallLogsResponse })
  async ingest(
    @Body() dto: IngestFirewallLogsDto,
    @Headers('x-ingest-token') token?: string,
  ): Promise<IngestFirewallLogsResponse> {
    this.assertIngestToken(token);

    const result = await this.ingestLogs.execute({
      lines: dto.lines,
      events: dto.events?.map((event) => ({
        sourceIp: event.sourceIp,
        targetIp: event.targetIp,
        targetPort: event.targetPort,
        protocol: event.protocol,
        eventType: event.eventType,
      })),
    });

    return {
      parsed: result.parsed,
      threatsCreated: result.threatsCreated,
      threats: result.threats.map((item) => this.toResponse(item)),
    };
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analisar evento de rede real e detectar ameaças' })
  @ApiResponse({ status: 201, type: [ThreatEventResponse] })
  async analyze(@Body() dto: AnalyzeThreatDto): Promise<ThreatEventResponse[]> {
    const enriched = await this.analyzeThreat.execute({
      sourceIp: dto.sourceIp,
      targetIp: dto.targetIp,
      targetPort: dto.targetPort,
      deviceType: dto.deviceType,
      protocol: dto.protocol,
      eventType: dto.eventType,
    });
    return enriched.map((item) => this.toResponse(item));
  }

  @Post('monitor')
  @ApiOperation({ summary: 'Varredura real da rede local em busca de portas de risco expostas' })
  @ApiResponse({ status: 201, type: [ThreatEventResponse] })
  async monitor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MonitorNetworkDto,
  ): Promise<ThreatEventResponse[]> {
    const enriched = await this.monitorNetwork.execute(dto.network, dto.cidr ?? 24);
    return enriched.map((item) => this.toResponse(item));
  }

  @Get('ip/:ip/intelligence')
  @ApiOperation({ summary: 'Consultar geolocalização e proprietário de um IP' })
  @ApiParam({ name: 'ip', example: '8.8.8.8' })
  @ApiResponse({ status: 200, type: IpIntelligenceResponse })
  async ipIntelligence(@Param('ip') ip: string): Promise<IpIntelligenceResponse> {
    const intel = await this.lookupIp.execute(ip);
    return this.toIpResponse(intel);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as ameaças detectadas' })
  async list(@CurrentUser() user: AuthenticatedUser): Promise<ThreatEventResponse[]> {
    const events = await this.listThreats.execute(user.sub);
    return events.map((event) => this.toResponse({ event }));
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar ameaças ativas' })
  async listActive(@CurrentUser() user: AuthenticatedUser): Promise<ThreatEventResponse[]> {
    const events = await this.listThreats.execute(user.sub);
    return events
      .filter((e) => e.toPlain().status === ThreatStatus.ACTIVE)
      .map((event) => this.toResponse({ event }));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de ameaças' })
  async stats(@CurrentUser() user: AuthenticatedUser): Promise<ThreatStatsResponse> {
    const all = await this.listThreats.execute(user.sub);
    const today = new Date().toDateString();
    return {
      activeThreats: all.filter((e) => e.toPlain().status === ThreatStatus.ACTIVE).length,
      criticalThreats: all.filter((e) => e.toPlain().severity === 'critical').length,
      resolvedToday: all.filter(
        (e) =>
          e.toPlain().status === ThreatStatus.RESOLVED &&
          new Date(e.toPlain().detectedAt).toDateString() === today,
      ).length,
      cameraIntrusions: all.filter((e) => e.type.includes('camera') || e.type.includes('rtsp'))
        .length,
      remoteAccessAttempts: all.filter(
        (e) => e.type.includes('rdp') || e.type.includes('ssh') || e.type.includes('remote'),
      ).length,
      blockedAttempts: all.length,
    };
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Marcar ameaça como resolvida' })
  async resolve(@Param('id') id: string): Promise<ThreatEventResponse> {
    const event = await this.resolveThreat.execute(id);
    if (!event) throw new NotFoundException('Threat not found');
    return this.toResponse({ event });
  }

  private assertIngestToken(token?: string): void {
    const expected = FIREWALL_LOG_CONFIG.INGEST_TOKEN;
    if (!expected) return;
    if (token !== expected) {
      throw new UnauthorizedException('Invalid ingest token');
    }
  }

  private toResponse(item: EnrichedThreatEvent | { event: ThreatEvent }): ThreatEventResponse {
    const plain = item.event.toPlain();
    return {
      id: plain.id,
      type: plain.type,
      severity: plain.severity,
      status: plain.status,
      title: plain.title,
      description: plain.description,
      sourceIp: plain.sourceIp,
      targetIp: plain.targetIp,
      targetPort: plain.targetPort,
      deviceType: plain.deviceType,
      remediation: plain.remediation,
      detectedAt: plain.detectedAt,
      sourceIpIntel:
        'sourceIpIntel' in item && item.sourceIpIntel
          ? this.toIpResponse(item.sourceIpIntel)
          : undefined,
    };
  }

  private toIpResponse(intel: IpIntelligence): IpIntelligenceResponse {
    return {
      ip: intel.ip,
      isPrivate: intel.isPrivate,
      country: intel.country,
      countryCode: intel.countryCode,
      region: intel.region,
      city: intel.city,
      isp: intel.isp,
      organization: intel.organization,
      asn: intel.asn,
      timezone: intel.timezone,
      latitude: intel.latitude,
      longitude: intel.longitude,
    };
  }
}
