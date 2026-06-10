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
    sourceIp: '203.0.113.14',
    targetIp: '192.168.1.42',
    description: 'Tentativa de acesso RTSP externo à câmera WiFi',
    detectedAt: new Date().toISOString(),
    status: 'active',
  },
];

const mockStats = {
  activeThreats: 3,
  criticalThreats: 1,
  resolvedToday: 2,
  monitoredDevices: 12,
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
];

const publicPages = [
  { path: '/', file: 'landing.png', name: 'Landing' },
  { path: '/login', file: 'login.png', name: 'Login' },
];

const dashboardPages = [
  { path: '/dashboard', file: 'dashboard-overview.png', name: 'Overview' },
  { path: '/dashboard/threats', file: 'dashboard-threats.png', name: 'Threats' },
  { path: '/dashboard/scans', file: 'dashboard-scans.png', name: 'Scans' },
  { path: '/dashboard/devices', file: 'dashboard-devices.png', name: 'Devices' },
  { path: '/dashboard/vulnerabilities', file: 'dashboard-vulnerabilities.png', name: 'Vulnerabilities' },
  { path: '/dashboard/license', file: 'dashboard-license.png', name: 'License' },
];

async function mockApi(page) {
  await page.route('**/auth/profile', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    }),
  );

  await page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900,
      }),
    }),
  );

  await page.route('**/scans**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockScans),
      });
    }
    return route.continue();
  });

  await page.route('**/devices**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDevices),
    }),
  );

  await page.route('**/threats/stats**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStats),
    }),
  );

  await page.route('**/threats**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockThreats),
      });
    }
    return route.continue();
  });

  await page.route('**/vulnerabilities**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockVulnerabilities),
    }),
  );

  await page.route('**/license/status**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        isActive: true,
        licenseKey: 'SCANDARK-TRIAL-DEV-0001',
        organizationName: 'ScanDark Trial',
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        maxUsers: 50,
        features: ['network_scan', 'threat_detection', 'vulnerability'],
        daysRemaining: 365,
      }),
    }),
  );
}

async function capture(page, url, file) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
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
  const page = await context.newPage();

  for (const { path, file } of publicPages) {
    await capture(page, `${BASE_URL}${path}`, file);
  }

  await mockApi(page);
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'mock-access-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
  });

  for (const { path, file } of dashboardPages) {
    await capture(page, `${BASE_URL}${path}`, file);
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
