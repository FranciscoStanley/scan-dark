export const PROJECT_AUTHOR = {
  name: 'Francisco Stanley Rodrigues Albuquerque',
} as const;

export const SERVICE_PORTS = {
  API_GATEWAY: 3000,
  AUTH: 3001,
  NETWORK_SCAN: 3002,
  DEVICE_DISCOVERY: 3003,
  VULNERABILITY: 3004,
  THREAT_DETECTION: 3005,
} as const;

export const SERVICE_URLS = {
  AUTH: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001',
  NETWORK_SCAN: process.env.NETWORK_SCAN_SERVICE_URL ?? 'http://localhost:3002',
  DEVICE_DISCOVERY: process.env.DEVICE_DISCOVERY_SERVICE_URL ?? 'http://localhost:3003',
  VULNERABILITY: process.env.VULNERABILITY_SERVICE_URL ?? 'http://localhost:3004',
  THREAT_DETECTION: process.env.THREAT_DETECTION_SERVICE_URL ?? 'http://localhost:3005',
} as const;

export const JWT_CONFIG = {
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-in-production',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-in-production',
  ACCESS_EXPIRES_IN: '15m',
  REFRESH_EXPIRES_IN: '7d',
} as const;

export const DATABASE_CONFIG = {
  URL: process.env.DATABASE_URL ?? 'postgresql://scandark:scandark_secret@localhost:5432/scandark',
} as const;

export const DEFAULT_USER_CONFIG = {
  ENABLED: process.env.DEFAULT_USER_ENABLED !== 'false',
  EMAIL: process.env.DEFAULT_USER_EMAIL ?? 'admin@your-company.com',
  PASSWORD: process.env.DEFAULT_USER_PASSWORD ?? 'ChangeMe-Secure-Password-123!',
  NAME: process.env.DEFAULT_USER_NAME ?? 'Administrator',
  ROLE: (process.env.DEFAULT_USER_ROLE ?? 'admin') as 'admin' | 'analyst' | 'viewer',
} as const;

export const REDIS_CONFIG = {
  URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
} as const;

export const RABBITMQ_CONFIG = {
  URL: process.env.RABBITMQ_URL ?? 'amqp://scandark:scandark_secret@localhost:5672',
  DEFAULT_USER: process.env.RABBITMQ_DEFAULT_USER ?? 'scandark',
  DEFAULT_PASS: process.env.RABBITMQ_DEFAULT_PASS ?? 'scandark_secret',
  MANAGEMENT_URL: process.env.RABBITMQ_MANAGEMENT_URL ?? 'http://localhost:15672',
  MANAGEMENT_USER: process.env.RABBITMQ_MANAGEMENT_USER ?? 'admin',
  MANAGEMENT_PASS: process.env.RABBITMQ_MANAGEMENT_PASS ?? 'change-me-management-password',
} as const;

export const COMMON_PORTS = {
  HTTP: 80,
  HTTPS: 443,
  SSH: 22,
  FTP: 21,
  TELNET: 23,
  SMTP: 25,
  DNS: 53,
  RTSP: 554,
  UPNP: 1900,
  SNMP: 161,
  RDP: 3389,
  SMB: 445,
  MQTT: 1883,
  COAP: 5683,
} as const;

export const IOT_SIGNATURES = {
  CAMERA: ['hikvision', 'dahua', 'axis', 'foscam', 'reolink', 'tp-link', 'wyze'],
  SMART_TV: ['samsung', 'lg', 'sony', 'roku', 'firetv', 'android tv', 'webos'],
  ROUTER: ['tp-link', 'd-link', 'netgear', 'asus', 'linksys', 'mikrotik', 'ubiquiti'],
  SPEAKER: ['amazon', 'echo', 'google home', 'nest', 'sonos'],
  NAS: ['synology', 'qnap', 'wd my cloud'],
} as const;

export const THREAT_THRESHOLDS = {
  MAX_FAILED_SSH_ATTEMPTS: 5,
  MAX_RDP_CONNECTIONS_PER_MINUTE: 3,
  RTSP_ACCESS_WINDOW_SECONDS: 60,
  PORT_SCAN_THRESHOLD: 10,
} as const;

export const IP_INTELLIGENCE_CONFIG = {
  API_URL: process.env.IP_INTELLIGENCE_API_URL ?? 'https://ipwho.is',
  TIMEOUT_MS: Number(process.env.IP_INTELLIGENCE_TIMEOUT_MS ?? 5000),
  CACHE_TTL_MS: Number(process.env.IP_INTELLIGENCE_CACHE_TTL_MS ?? 3_600_000),
} as const;

export const MONITOR_NETWORK_CONFIG = {
  DEFAULT_NETWORK: process.env.MONITOR_NETWORK ?? '192.168.1.0',
  DEFAULT_CIDR: Number(process.env.MONITOR_CIDR ?? 24),
} as const;

export const FIREWALL_LOG_CONFIG = {
  ENABLED: process.env.FIREWALL_LOG_ENABLED === 'true',
  PATH: process.env.FIREWALL_LOG_PATH ?? '',
  POLL_MS: Number(process.env.FIREWALL_LOG_POLL_MS ?? 5000),
  INGEST_TOKEN: process.env.FIREWALL_INGEST_TOKEN ?? '',
} as const;

export const DATABASE_SYNC = process.env.DATABASE_SYNC === 'true';

export const RATE_LIMIT_CONFIG = {
  TTL_MS: Number(process.env.RATE_LIMIT_TTL_MS ?? 60_000),
  LIMIT: Number(process.env.RATE_LIMIT_MAX ?? 100),
} as const;

export const LICENSE_CONFIG = {
  TRIAL_KEY: process.env.LICENSE_TRIAL_KEY ?? 'SCANDARK-TRIAL-DEV-0001',
  TRIAL_ORGANIZATION: process.env.LICENSE_TRIAL_ORGANIZATION ?? 'ScanDark Trial',
  TRIAL_DAYS: Number(process.env.LICENSE_TRIAL_DAYS ?? 365),
  REQUIRE_ACTIVE: process.env.LICENSE_REQUIRE_ACTIVE !== 'false',
} as const;

export const INTERNAL_SERVICE_CONFIG = {
  SECRET: process.env.INTERNAL_SERVICE_SECRET ?? 'dev-internal-secret-change-in-production',
} as const;

export const RABBITMQ_QUEUES = {
  SCAN_JOBS: 'scandark.scan.jobs',
} as const;
