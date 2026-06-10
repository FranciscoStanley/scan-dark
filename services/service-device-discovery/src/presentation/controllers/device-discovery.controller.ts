import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeviceResponse } from '@scandark/contracts';
import { CurrentUser, AuthenticatedUser, InternalOrJwtGuard } from '@scandark/nest-auth';
import {
  FingerprintDeviceUseCase,
  ListDevicesUseCase,
  ListDevicesByScanUseCase,
} from '../../application/use-cases/device-discovery.use-cases';

interface FingerprintDto {
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  openPorts: number[];
  scanId: string;
}

@ApiTags('Device Discovery')
@Controller('devices')
@UseGuards(InternalOrJwtGuard)
@ApiBearerAuth()
export class DeviceDiscoveryController {
  constructor(
    private readonly fingerprintDevice: FingerprintDeviceUseCase,
    private readonly listDevices: ListDevicesUseCase,
    private readonly listDevicesByScan: ListDevicesByScanUseCase,
  ) {}

  @Post('fingerprint')
  @ApiOperation({ summary: 'Fingerprint and classify a network device' })
  async fingerprint(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: FingerprintDto,
  ): Promise<DeviceResponse> {
    return this.fingerprintDevice.execute({ ...dto, userId: user.sub });
  }

  @Get()
  @ApiOperation({ summary: 'List all discovered devices for the current user' })
  async listAll(@CurrentUser() user: AuthenticatedUser): Promise<DeviceResponse[]> {
    return this.listDevices.execute(user.sub);
  }

  @Get('scan/:scanId')
  @ApiOperation({ summary: 'List devices discovered in a scan' })
  async listByScan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('scanId') scanId: string,
  ): Promise<DeviceResponse[]> {
    return this.listDevicesByScan.execute(scanId, user.sub);
  }
}
