import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { INTERNAL_SERVICE_CONFIG } from '@scandark/config';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ActivateLicenseDto, LicenseStatusResponse } from '@scandark/contracts';
import { JwtAuthGuard, RolesGuard, Roles } from '@scandark/nest-auth';
import { Result, UserRole } from '@scandark/shared-kernel';
import { ActivateLicenseUseCase, GetLicenseStatusUseCase } from '../../application/use-cases/license.use-cases';

@ApiTags('License')
@Controller('auth/license')
export class LicenseController {
  constructor(
    private readonly getLicenseStatus: GetLicenseStatusUseCase,
    private readonly activateLicense: ActivateLicenseUseCase,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get active license status' })
  @ApiResponse({ status: 200, type: LicenseStatusResponse })
  async status(
    @Headers('authorization') auth?: string,
    @Headers('x-internal-secret') internalSecret?: string,
  ): Promise<LicenseStatusResponse> {
    const isInternal = internalSecret === INTERNAL_SERVICE_CONFIG.SECRET;
    if (!isInternal && !auth) {
      throw new UnauthorizedException('Authentication required');
    }
    const result = await this.getLicenseStatus.execute();
    if (Result.isFail(result)) {
      throw new BadRequestException(result.error.message);
    }
    const license = result.value!;
    const plain = license.toPlain();
    return {
      isActive: license.isValid(),
      licenseKey: plain.licenseKey,
      organizationName: plain.organizationName,
      expiresAt: plain.expiresAt.toISOString(),
      maxUsers: plain.maxUsers,
      features: plain.features,
      daysRemaining: plain.daysRemaining,
    };
  }

  @Post('activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a license key (admin only)' })
  async activate(@Body() dto: ActivateLicenseDto): Promise<LicenseStatusResponse> {
    const result = await this.activateLicense.execute(dto.licenseKey);
    if (Result.isFail(result)) {
      if (result.error.name === 'NotFoundError') {
        throw new NotFoundException(result.error.message);
      }
      throw new BadRequestException(result.error.message);
    }
    const license = result.value!;
    const plain = license.toPlain();
    return {
      isActive: license.isValid(),
      licenseKey: plain.licenseKey,
      organizationName: plain.organizationName,
      expiresAt: plain.expiresAt.toISOString(),
      maxUsers: plain.maxUsers,
      features: plain.features,
      daysRemaining: plain.daysRemaining,
    };
  }
}
