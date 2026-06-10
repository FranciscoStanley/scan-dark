import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SERVICE_URLS } from '@scandark/config';

@Injectable()
export class ServiceProxy {
  private readonly logger = new Logger(ServiceProxy.name);

  constructor(private readonly http: HttpService) {}

  async forwardAuth(path: string, method: string, body?: unknown, token?: string) {
    return this.forward(SERVICE_URLS.AUTH, path, method, body, token);
  }

  async forwardNetworkScan(path: string, method: string, body?: unknown, headers?: Record<string, string>) {
    return this.forward(SERVICE_URLS.NETWORK_SCAN, path, method, body, headers?.['authorization'], headers);
  }

  async forwardDeviceDiscovery(
    path: string,
    method: string,
    body?: unknown,
    token?: string,
    extraHeaders?: Record<string, string>,
  ) {
    return this.forward(SERVICE_URLS.DEVICE_DISCOVERY, path, method, body, token, extraHeaders);
  }

  async forwardVulnerability(
    path: string,
    method: string,
    body?: unknown,
    token?: string,
    extraHeaders?: Record<string, string>,
  ) {
    return this.forward(SERVICE_URLS.VULNERABILITY, path, method, body, token, extraHeaders);
  }

  async forwardThreatDetection(
    path: string,
    method: string,
    body?: unknown,
    token?: string,
    extraHeaders?: Record<string, string>,
  ) {
    return this.forward(SERVICE_URLS.THREAT_DETECTION, path, method, body, token, extraHeaders);
  }

  private async forward(
    baseUrl: string,
    path: string,
    method: string,
    body?: unknown,
    token?: string,
    extraHeaders?: Record<string, string>,
  ) {
    const url = `${baseUrl}${path}`;
    this.logger.debug(`Proxying ${method} ${url}`);

    const headers: Record<string, string> = { ...extraHeaders };
    if (token) headers['Authorization'] = token.startsWith('Bearer') ? token : `Bearer ${token}`;

    const response = await firstValueFrom(
      this.http.request({
        url,
        method,
        data: body,
        headers,
      }),
    );

    return response.data;
  }
}
