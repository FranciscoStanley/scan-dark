import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CreateScanDto, ScanResponse } from '@scandark/contracts';
import { CurrentUser, AuthenticatedUser, InternalOrJwtGuard } from '@scandark/nest-auth';
import { Result } from '@scandark/shared-kernel';
import {
  CreateNetworkScanUseCase,
  GetNetworkScanUseCase,
  ListNetworkScansUseCase,
} from '../../application/use-cases/network-scan.use-cases';

@ApiTags('Network Scan')
@Controller('scans')
@UseGuards(InternalOrJwtGuard)
@ApiBearerAuth()
export class NetworkScanController {
  constructor(
    private readonly createScan: CreateNetworkScanUseCase,
    private readonly getScan: GetNetworkScanUseCase,
    private readonly listScans: ListNetworkScansUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create and start a network security scan' })
  @ApiResponse({ status: 201, type: ScanResponse })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScanDto,
  ): Promise<ScanResponse> {
    const result = await this.createScan.execute({
      ...dto,
      userId: user.sub,
    });

    if (Result.isFail(result)) {
      throw new BadRequestException(result.error.message);
    }

    return this.toResponse(result.value!);
  }

  @Get()
  @ApiOperation({ summary: 'List all scans for the authenticated user' })
  async list(@CurrentUser() user: AuthenticatedUser): Promise<ScanResponse[]> {
    const scans = await this.listScans.execute(user.sub);
    return scans.map((s) => this.toResponse(s));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scan details and results' })
  async getById(@Param('id') id: string): Promise<ScanResponse> {
    const result = await this.getScan.execute(id);
    if (Result.isFail(result)) {
      throw new NotFoundException(result.error.message);
    }
    return this.toResponse(result.value!);
  }

  private toResponse(scan: import('../../domain/entities/network-scan.entity').NetworkScan): ScanResponse {
    return {
      id: scan.id,
      name: scan.name,
      type: scan.type,
      targetNetwork: scan.targetNetwork,
      status: scan.status,
      progress: scan.progress,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.status === 'completed' ? scan.updatedAt.toISOString() : undefined,
      results: scan.results
        ? {
            hosts: scan.results.hosts,
            totalHostsScanned: scan.results.totalHostsScanned,
            aliveHosts: scan.results.aliveHosts,
            durationMs: scan.results.durationMs,
          }
        : undefined,
    };
  }
}
