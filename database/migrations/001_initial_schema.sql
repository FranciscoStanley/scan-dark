-- ScanDark initial schema (idempotent)
-- Run: psql $DATABASE_URL -f database/migrations/001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE scan_type AS ENUM ('network_discovery', 'port_scan', 'iot_fingerprint', 'wifi_audit', 'router_audit', 'full_assessment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE device_type AS ENUM ('camera', 'smart_tv', 'router', 'speaker', 'nas', 'computer', 'mobile', 'iot', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vulnerability_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE threat_type AS ENUM ('rtsp_intrusion', 'rdp_brute_force', 'ssh_brute_force', 'port_scan', 'lateral_movement', 'firewall_block', 'suspicious_traffic');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE threat_status AS ENUM ('active', 'resolved', 'ignored');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY,
  license_key VARCHAR(64) UNIQUE NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 10,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS network_scans (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type scan_type NOT NULL,
  target_network VARCHAR(45) NOT NULL,
  cidr INTEGER NOT NULL DEFAULT 24,
  ports INTEGER[] NOT NULL DEFAULT '{}',
  status scan_status NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  results JSONB,
  error_message TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_network_scans_user_id ON network_scans(user_id);

CREATE TABLE IF NOT EXISTS network_devices (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  mac_address VARCHAR(17),
  hostname VARCHAR(255),
  device_type device_type NOT NULL DEFAULT 'unknown',
  vendor VARCHAR(255),
  os VARCHAR(255),
  open_ports INTEGER[] NOT NULL DEFAULT '{}',
  services JSONB NOT NULL DEFAULT '[]',
  risk_score INTEGER NOT NULL DEFAULT 0,
  scan_id UUID NOT NULL,
  identity_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_network_devices_identity_user ON network_devices(identity_key, user_id);
CREATE INDEX IF NOT EXISTS idx_network_devices_scan_id ON network_devices(scan_id);
CREATE INDEX IF NOT EXISTS idx_network_devices_user_id ON network_devices(user_id);

CREATE TABLE IF NOT EXISTS vulnerability_findings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  scan_id UUID,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  severity vulnerability_severity NOT NULL,
  cve_id VARCHAR(50),
  remediation TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vulnerability_findings_device_id ON vulnerability_findings(device_id);
CREATE INDEX IF NOT EXISTS idx_vulnerability_findings_scan_id ON vulnerability_findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_vulnerability_findings_user_id ON vulnerability_findings(user_id);

CREATE TABLE IF NOT EXISTS threat_events (
  id UUID PRIMARY KEY,
  user_id UUID,
  type threat_type NOT NULL,
  severity vulnerability_severity NOT NULL,
  status threat_status NOT NULL DEFAULT 'active',
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  source_ip VARCHAR(45) NOT NULL,
  target_ip VARCHAR(45),
  target_port INTEGER,
  device_type device_type,
  remediation TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threat_events_status ON threat_events(status);
CREATE INDEX IF NOT EXISTS idx_threat_events_user_id ON threat_events(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_events_created_at ON threat_events(created_at DESC);
