import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthenticatedUser } from '@scandark/nest-auth';
import { JwtAuthGuard } from '@scandark/nest-auth';
import { ServiceProxy } from '../../infrastructure/proxy/service.proxy';
import { LicenseGuard } from '../guards/license.guard';

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

@ApiTags('Gateway')
@Controller()
export class GatewayController {
  constructor(private readonly proxy: ServiceProxy) {}

  @Get('health')
  @ApiOperation({ summary: 'Gateway health check' })
  health() {
    return {
      status: 'ok',
      service: 'service-api-gateway',
      timestamp: new Date().toISOString(),
      services: [
        'service-auth',
        'service-network-scan',
        'service-device-discovery',
        'service-vulnerability',
        'service-threat-detection',
      ],
    };
  }

  @All('auth/*')
  @ApiOperation({
    summary: 'Proxy para service-auth',
    description: 'Encaminha register, login, refresh, profile, license e audit.',
  })
  async authProxy(@Req() req: Request, @Res() res: Response) {
    const path = req.url;
    try {
      const data = await this.proxy.forwardAuth(path, req.method, req.body, req.headers.authorization);
      res.status(req.method === 'POST' && path.includes('/register') ? 201 : 200).json(data);
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data: unknown } };
      res.status(err.response?.status ?? 500).json(err.response?.data ?? { message: 'Service unavailable' });
    }
  }

  @All('scans/*')
  @UseGuards(JwtAuthGuard, LicenseGuard)
  @ApiBearerAuth()
  async scanProxy(@Req() req: AuthRequest, @Res() res: Response) {
    return this.forwardProtected(req, res, 'network-scan');
  }

  @All('scans')
  @UseGuards(JwtAuthGuard, LicenseGuard)
  @ApiBearerAuth()
  async scanListProxy(@Req() req: AuthRequest, @Res() res: Response) {
    return this.scanProxy(req, res);
  }

  @All('devices')
  @UseGuards(JwtAuthGuard, LicenseGuard)
  @ApiBearerAuth()
  async deviceListProxy(@Req() req: AuthRequest, @Res() res: Response) {
    return this.deviceProxy(req, res);
  }

  @All('devices/*')
  @UseGuards(JwtAuthGuard, LicenseGuard)
  @ApiBearerAuth()
  async deviceProxy(@Req() req: AuthRequest, @Res() res: Response) {
    return this.forwardProtected(req, res, 'device-discovery');
  }

  @All('vulnerabilities/*')
  @UseGuards(JwtAuthGuard, LicenseGuard)
  @ApiBearerAuth()
  async vulnProxy(@Req() req: AuthRequest, @Res() res: Response) {
    return this.forwardProtected(req, res, 'vulnerability');
  }

  @All('threats/*')
  @UseGuards(JwtAuthGuard, LicenseGuard)
  @ApiBearerAuth()
  async threatProxy(@Req() req: AuthRequest, @Res() res: Response) {
    return this.forwardProtected(req, res, 'threat-detection');
  }

  @All('threats')
  @UseGuards(JwtAuthGuard, LicenseGuard)
  @ApiBearerAuth()
  async threatListProxy(@Req() req: AuthRequest, @Res() res: Response) {
    return this.threatProxy(req, res);
  }

  private async forwardProtected(
    req: AuthRequest,
    res: Response,
    service: 'network-scan' | 'device-discovery' | 'vulnerability' | 'threat-detection',
  ) {
    const token = req.headers.authorization ?? '';
    const headers = {
      authorization: token,
      'x-user-id': req.user?.sub ?? '',
    };

    try {
      let data: unknown;
      switch (service) {
        case 'network-scan':
          data = await this.proxy.forwardNetworkScan(req.url, req.method, req.body, headers);
          break;
        case 'device-discovery':
          data = await this.proxy.forwardDeviceDiscovery(req.url, req.method, req.body, token, headers);
          break;
        case 'vulnerability':
          data = await this.proxy.forwardVulnerability(req.url, req.method, req.body, token, headers);
          break;
        case 'threat-detection':
          data = await this.proxy.forwardThreatDetection(req.url, req.method, req.body, token, headers);
          break;
      }
      res.status(200).json(data);
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data: unknown } };
      res.status(err.response?.status ?? 500).json(err.response?.data ?? { message: 'Service unavailable' });
    }
  }
}
