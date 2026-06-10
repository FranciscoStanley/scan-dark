export enum DeviceType {
  ROUTER = 'router',
  SWITCH = 'switch',
  ACCESS_POINT = 'access_point',
  CAMERA = 'camera',
  SMART_TV = 'smart_tv',
  MOBILE = 'mobile',
  COMPUTER = 'computer',
  IOT = 'iot',
  PRINTER = 'printer',
  NAS = 'nas',
  GAMING = 'gaming',
  SPEAKER = 'speaker',
  UNKNOWN = 'unknown',
}

export enum VulnerabilitySeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export enum ScanStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ScanType {
  NETWORK_DISCOVERY = 'network_discovery',
  PORT_SCAN = 'port_scan',
  VULNERABILITY = 'vulnerability',
  WIFI_AUDIT = 'wifi_audit',
  IOT_FINGERPRINT = 'iot_fingerprint',
  ROUTER_AUDIT = 'router_audit',
  THREAT_MONITOR = 'threat_monitor',
  FULL_ASSESSMENT = 'full_assessment',
}

export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

export enum ThreatType {
  UNAUTHORIZED_CAMERA_ACCESS = 'unauthorized_camera_access',
  RTSP_STREAM_HIJACK = 'rtsp_stream_hijack',
  REMOTE_DESKTOP_INTRUSION = 'remote_desktop_intrusion',
  SSH_BRUTE_FORCE = 'ssh_brute_force',
  UNAUTHORIZED_RDP = 'unauthorized_rdp',
  PORT_SCAN_DETECTED = 'port_scan_detected',
  ARP_SPOOFING = 'arp_spoofing',
  SUSPICIOUS_IOT_ACCESS = 'suspicious_iot_access',
  UNAUTHORIZED_DEVICE = 'unauthorized_device',
  DATA_EXFILTRATION = 'data_exfiltration',
  MAN_IN_THE_MIDDLE = 'man_in_the_middle',
  LATERAL_MOVEMENT = 'lateral_movement',
}

export enum ThreatStatus {
  ACTIVE = 'active',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
}

export enum AccessLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  RESTRICTED = 'restricted',
  CRITICAL = 'critical',
}
