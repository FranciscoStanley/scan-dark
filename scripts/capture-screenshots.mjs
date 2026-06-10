/**
 * Captura screenshots do frontend para documentação.
 * Pré-requisito: frontend rodando em http://localhost:3100
 *
 * Uso: node scripts/capture-screenshots.mjs
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'docs', 'assets', 'screenshots');
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3100';
const API_URL = process.env.SCREENSHOT_API_URL ?? 'http://localhost:3000';

const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@your-company.com',
  name: 'Administrator',
  role: 'admin',
};

const mockScans = [
  {
    id: 'scan-demo-1',
    name: 'Avaliação Completa — LAN',
    type: 'full_assessment',
    targetNetwork: '192.168.1.0/24',
    status: 'completed',
    progress: 100,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    results: {
      hosts: [
        { ipAddress: '192.168.1.1', hostname: 'router.local', isAlive: true, openPorts: [80, 443, 22] },
        { ipAddress: '192.168.1.42', hostname: 'camera-wifi', isAlive: true, openPorts: [554, 80] },
      ],
      totalHostsScanned: 254,
      aliveHosts: 12,
      durationMs: 8420,
    },
  },
];

const mockDevices = [
  {
    id: 'dev-1',
    ipAddress: '192.168.1.42',
    hostname: 'camera-wifi',
    deviceType: 'camera',
    vendor: 'Hikvision',
    riskScore: 78,
    openPorts: [554, 80, 443],
  },
  {
    id: 'dev-2',
    ipAddress: '192.168.1.1',
    hostname: 'router.local',
    deviceType: 'router',
    vendor: 'TP-Link',
    riskScore: 35,
    openPorts: [80, 443, 22],
  },
];

const mockThreats = [
  {
    id: 'threat-1',
    type: 'unauthorized_camera_access',
    severity: 'critical',
    status: 'active',
    title: 'Acesso RTSP não autorizado',
    description: 'Tentativa de acesso RTSP externo à câmera WiFi',
    sourceIp: '203.0.113.14',
    targetIp: '192.168.1.42',
    targetPort: 554,
    remediation: 'Bloquear porta 554 na borda e restringir VLAN IoT.',
    detectedAt: new Date().toISOString(),
    sourceIpIntel: {
      ip: '203.0.113.14',
      isPrivate: false,
      country: 'United States',
      city: 'Ashburn',
      organization: 'Example Cloud Provider',
      isp: 'Example ISP',
      asn: 'AS64500',
    },
  },
];

const mockStats = {
  activeThreats: 3,
  criticalThreats: 1,
  resolvedToday: 2,
  cameraIntrusions: 1,
  remoteAccessAttempts: 2,
  blockedAttempts: 5,
};

const mockVulnerabilities = [
  {
    id: 'vuln-1',
    deviceId: 'dev-1',
    title: 'RTSP exposto sem autenticação',
    description: 'Stream de vídeo acessível na porta 554 sem credenciais.',
    severity: 'critical',
    cveId: 'CVE-2021-36260',
    remediation: 'Habilitar autenticação RTSP e restringir acesso na VLAN IoT.',
    detectedAt: new Date().toISOString(),
  },
  {
    id: 'vuln-2',
    deviceId: 'dev-2',
    title: 'Interface admin exposta na WAN',
    description: 'Painel web do roteador acessível externamente.',
    severity: 'high',
    cveId: 'CVE-2020-8958',
    remediation: 'Desabilitar acesso remoto ao painel administrativo.',
    detectedAt: new Date().toISOString(),
  },
];

const mockVulnSummary = {
  totalDevices: 2,
  criticalVulnerabilities: 1,
  highVulnerabilities: 1,
  mediumVulnerabilities: 0,
  lowVulnerabilities: 0,
  averageRiskScore: 56,
};

const mockNetworkDefaults = {
  network: '192.168.1.0',
  cidr: 24,
  source: 'auto-detected',
  interfaceName: 'eth0',
};

const mockIngestion = {
  enabled: true,
  watching: true,
  logPath: '/var/log/firewall.log',
  pollMs: 5000,
  linesProcessed: 1240,
  threatsCreated: 3,
  lastIngestAt: new Date().toISOString(),
};

const publicPages = [
  { path: '/', file: 'landing.png', name: 'Landing' },
  { path: '/login', file: 'login.png', name: 'Login' },
];

const dashboardPages = [
  { path: '/dashboard', file: 'dashboard-overview.png', name: 'Overview', waitFor: 'text=Overview' },
  { path: '/dashboard/threats', file: 'dashboard-threats.png', name: 'Threats', waitFor: 'text=Centro de Ameaças' },
  { path: '/dashboard/scans', file: 'dashboard-scans.png', name: 'Scans', waitFor: 'text=Scans de Rede' },
  { path: '/dashboard/devices', file: 'dashboard-devices.png', name: 'Devices', waitFor: 'text=Dispositivos' },
  {
    path: '/dashboard/vulnerabilities',
    file: 'dashboard-vulnerabilities.png',
    name: 'Vulnerabilities',
    waitFor: 'text=Vulnerabilidades',
  },
  { path: '/dashboard/license', file: 'dashboard-license.png', name: 'License', waitFor: 'text=Licença' },
];

function jsonResponse(body, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

async function mockApi(page) {
  await page.route(`${API_URL}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    const method = route.request().method();

    if (pathname === '/auth/profile' && method === 'GET') {
      return route.fulfill(jsonResponse(mockUser));
    }

    if (pathname === '/auth/refresh' && method === 'POST') {
      return route.fulfill(
        jsonResponse({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 900,
        }),
      );
    }

    if (pathname === '/scans' && method === 'GET') {
      return route.fulfill(jsonResponse(mockScans));
    }

    if (pathname === '/scans' && method === 'POST') {
      return route.fulfill(
        jsonResponse({
          ...mockScans[0],
          id: 'scan-new',
          name: 'Novo Scan',
          status: 'running',
          progress: 10,
          createdAt: new Date().toISOString(),
        }),
      );
    }

    if (pathname.startsWith('/scans/') && method === 'GET') {
      return route.fulfill(jsonResponse(mockScans[0]));
    }

    if (pathname === '/devices' && method === 'GET') {
      return route.fulfill(jsonResponse(mockDevices));
    }

    if (pathname.startsWith('/devices/scan/') && method === 'GET') {
      return route.fulfill(jsonResponse(mockDevices));
    }

    if (pathname === '/threats/active' && method === 'GET') {
      return route.fulfill(jsonResponse(mockThreats));
    }

    if (pathname === '/threats/stats' && method === 'GET') {
      return route.fulfill(jsonResponse(mockStats));
    }

    if (pathname === '/threats/ingestion/status' && method === 'GET') {
      return route.fulfill(jsonResponse(mockIngestion));
    }

    if (pathname === '/threats/network/defaults' && method === 'GET') {
      return route.fulfill(jsonResponse(mockNetworkDefaults));
    }

    if (pathname === '/threats/monitor' && method === 'POST') {
      return route.fulfill(jsonResponse(mockThreats));
    }

    if (pathname.endsWith('/resolve') && method === 'PATCH') {
      return route.fulfill(jsonResponse({ ...mockThreats[0], status: 'resolved' }));
    }

    if (pathname.startsWith('/vulnerabilities/device/') && method === 'GET') {
      const deviceId = pathname.split('/').pop();
      return route.fulfill(jsonResponse(mockVulnerabilities.filter((v) => v.deviceId === deviceId)));
    }

    if (pathname.startsWith('/vulnerabilities/summary/') && method === 'GET') {
      return route.fulfill(jsonResponse(mockVulnSummary));
    }

    if (pathname === '/license/status' && method === 'GET') {
      return route.fulfill(
        jsonResponse({
          isActive: true,
          licenseKey: 'SCANDARK-TRIAL-DEV-0001',
          organizationName: 'ScanDark Trial',
          expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
          maxUsers: 50,
          features: ['network_scan', 'threat_detection', 'vulnerability'],
          daysRemaining: 365,
        }),
      );
    }

    return route.continue();
  });
}

async function capture(page, url, file, waitFor) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  if (waitFor) {
    await page.waitForSelector(waitFor, { timeout: 15000 });
  }
  await page.waitForTimeout(500);
  await page.screenshot({
    path: join(OUT_DIR, file),
    fullPage: false,
  });
  console.log(`✓ ${file}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    colorScheme: 'dark',
    deviceScaleFactor: 2,
  });

  await context.addInitScript(() => {
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
  });

  const page = await context.newPage();

  for (const { path, file } of publicPages) {
    await capture(page, `${BASE_URL}${path}`, file);
  }

  await mockApi(page);

  for (const { path, file, waitFor } of dashboardPages) {
    await capture(page, `${BASE_URL}${path}`, file, waitFor);
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
