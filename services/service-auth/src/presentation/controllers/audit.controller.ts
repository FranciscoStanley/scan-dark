import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogResponse } from '@scandark/contracts';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser, AuthenticatedUser } from '@scandark/nest-auth';
import { UserRole } from '@scandark/shared-kernel';
import { CreateAuditLogUseCase, ListAuditLogsUseCase } from '../../application/use-cases/audit-log.use-case';

class CreateAuditLogDto {
  action!: string;
  resource!: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

@ApiTags('Audit')
@Controller('auth/audit')
export class AuditController {
  constructor(
    private readonly createAuditLog: CreateAuditLogUseCase,
    private readonly listAuditLogs: ListAuditLogsUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record an audit log entry' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAuditLogDto,
  ): Promise<AuditLogResponse> {
    const log = await this.createAuditLog.execute({
      userId: user.sub,
      action: dto.action,
      resource: dto.resource,
      ipAddress: dto.ipAddress,
      metadata: dto.metadata,
    });
    return log.toPlain() as AuditLogResponse;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List recent audit logs (admin only)' })
  async list(@Query('limit') limit?: string): Promise<AuditLogResponse[]> {
    const logs = await this.listAuditLogs.execute(limit ? Number(limit) : 100);
    return logs.map((l) => l.toPlain() as AuditLogResponse);
  }
}
