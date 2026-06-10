import {
  DeviceType,
  ThreatType,
  ThreatStatus,
  VulnerabilitySeverity,
} from '@scandark/shared-kernel';
import { COMMON_PORTS, THREAT_THRESHOLDS } from '@scandark/config';
import { ThreatEvent } from '../entities/threat-event.entity';
import { isPrivateIp } from '../value-objects/ip-intelligence.vo';

export interface NetworkEventInput {
  sourceIp: string;
  targetIp?: string;
  targetPort?: number;
  deviceType?: DeviceType;
  protocol?: string;
  eventType?: string;
  failedAttempts?: number;
  isExternal?: boolean;
}

export class IntrusionDetectionEngine {
  analyze(input: NetworkEventInput): ThreatEvent[] {
    const normalized: NetworkEventInput = {
      ...input,
      isExternal: input.isExternal ?? !isPrivateIp(input.sourceIp),
    };

    const threats: ThreatEvent[] = [];

    threats.push(...this.detectExposedServices(normalized));
    threats.push(...this.detectCameraIntrusions(normalized));
    threats.push(...this.detectRemoteAccessThreats(normalized));
    threats.push(...this.detectPortScanning(normalized));
    threats.push(...this.detectUnauthorizedDevices(normalized));
    threats.push(...this.detectLateralMovement(normalized));

    return threats;
  }

  analyzeNetworkFindings(inputs: NetworkEventInput[]): ThreatEvent[] {
    return inputs.flatMap((input) => this.analyze(input));
  }

  private detectExposedServices(input: NetworkEventInput): ThreatEvent[] {
    if (input.eventType !== 'exposed_service') return [];

    const threats: ThreatEvent[] = [];

    if (input.targetPort === COMMON_PORTS.RTSP) {
      threats.push(
        ThreatEvent.create({
          type: ThreatType.RTSP_STREAM_HIJACK,
          severity: VulnerabilitySeverity.HIGH,
          status: ThreatStatus.ACTIVE,
          title: 'Porta RTSP exposta na rede local',
          description: `Varredura detectou porta RTSP (${COMMON_PORTS.RTSP}) aberta em ${input.targetIp}. O stream de vídeo pode ser acessado por dispositivos não autorizados na LAN.`,
          sourceIp: input.sourceIp,
          targetIp: input.targetIp,
          targetPort: COMMON_PORTS.RTSP,
          deviceType: DeviceType.CAMERA,
          remediation:
            'Isole câmeras em VLAN IoT, habilite autenticação RTSP, bloqueie acesso externo e atualize firmware.',
        }),
      );
    }

    if (input.targetPort === COMMON_PORTS.RDP) {
      threats.push(
        ThreatEvent.create({
          type: ThreatType.REMOTE_DESKTOP_INTRUSION,
          severity: VulnerabilitySeverity.CRITICAL,
          status: ThreatStatus.ACTIVE,
          title: 'Serviço RDP exposto na rede',
          description: `Varredura detectou RDP (porta ${COMMON_PORTS.RDP}) acessível em ${input.targetIp}. Acesso remoto pode ser explorado por atacantes.`,
          sourceIp: input.sourceIp,
          targetIp: input.targetIp,
          targetPort: COMMON_PORTS.RDP,
          deviceType: DeviceType.COMPUTER,
          remediation: 'Desabilite RDP na LAN se não necessário, use VPN, habilite NLA e MFA.',
        }),
      );
    }

    if (input.targetPort === COMMON_PORTS.SSH) {
      threats.push(
        ThreatEvent.create({
          type: ThreatType.SSH_BRUTE_FORCE,
          severity: VulnerabilitySeverity.MEDIUM,
          status: ThreatStatus.INVESTIGATING,
          title: 'SSH exposto na rede local',
          description: `Porta SSH (${COMMON_PORTS.SSH}) aberta em ${input.targetIp}. Verifique se o acesso é intencional e protegido.`,
          sourceIp: input.sourceIp,
          targetIp: input.targetIp,
          targetPort: COMMON_PORTS.SSH,
          remediation: 'Use chaves SSH, desabilite login root, configure fail2ban e limite IPs autorizados.',
        }),
      );
    }

    if (input.targetPort === COMMON_PORTS.TELNET || input.targetPort === COMMON_PORTS.SMB) {
      const service = input.targetPort === COMMON_PORTS.TELNET ? 'Telnet' : 'SMB';
      threats.push(
        ThreatEvent.create({
          type: ThreatType.UNAUTHORIZED_DEVICE,
          severity: VulnerabilitySeverity.HIGH,
          status: ThreatStatus.ACTIVE,
          title: `Serviço ${service} exposto`,
          description: `Porta ${input.targetPort} (${service}) detectada aberta em ${input.targetIp}. Protocolos legados aumentam a superfície de ataque.`,
          sourceIp: input.sourceIp,
          targetIp: input.targetIp,
          targetPort: input.targetPort,
          remediation: `Desabilite ${service} se não for necessário e restrinja acesso via firewall interno.`,
        }),
      );
    }

    return threats;
  }

  private detectCameraIntrusions(input: NetworkEventInput): ThreatEvent[] {
    if (input.targetPort !== COMMON_PORTS.RTSP && input.deviceType !== DeviceType.CAMERA) {
      return [];
    }

    const threats: ThreatEvent[] = [];

    if (input.isExternal) {
      threats.push(
        ThreatEvent.create({
          type: ThreatType.UNAUTHORIZED_CAMERA_ACCESS,
          severity: VulnerabilitySeverity.CRITICAL,
          status: ThreatStatus.ACTIVE,
          title: 'Acesso externo não autorizado a câmera WiFi',
          description: `IP externo ${input.sourceIp} tentou acessar stream RTSP da câmera ${input.targetIp ?? 'desconhecida'}. Possível invasão ou vazamento de feed de vídeo.`,
          sourceIp: input.sourceIp,
          targetIp: input.targetIp,
          targetPort: input.targetPort,
          deviceType: DeviceType.CAMERA,
          remediation: 'Bloqueie acesso RTSP externo, habilite autenticação forte, isole câmeras em VLAN dedicada e atualize firmware.',
        }),
      );
    }

    if (input.eventType === 'internal_unauthorized_access') {
      threats.push(
        ThreatEvent.create({
          type: ThreatType.RTSP_STREAM_HIJACK,
          severity: VulnerabilitySeverity.HIGH,
          status: ThreatStatus.ACTIVE,
          title: 'Acesso interno suspeito a câmera',
          description: `Dispositivo ${input.sourceIp} acessou câmera ${input.targetIp} sem autorização conhecida.`,
          sourceIp: input.sourceIp,
          targetIp: input.targetIp,
          targetPort: COMMON_PORTS.RTSP,
          deviceType: DeviceType.CAMERA,
          remediation: 'Verifique dispositivos autorizados, configure ACL no roteador e habilite logs de acesso RTSP.',
        }),
      );
    }

    return threats;
  }

  private detectRemoteAccessThreats(input: NetworkEventInput): ThreatEvent[] {
    const threats: ThreatEvent[] = [];

    if (input.targetPort === COMMON_PORTS.RDP) {
      const attempts = input.failedAttempts ?? 0;
      if (attempts >= THREAT_THRESHOLDS.MAX_RDP_CONNECTIONS_PER_MINUTE || input.isExternal) {
        threats.push(
          ThreatEvent.create({
            type: input.isExternal ? ThreatType.UNAUTHORIZED_RDP : ThreatType.REMOTE_DESKTOP_INTRUSION,
            severity: VulnerabilitySeverity.CRITICAL,
            status: ThreatStatus.ACTIVE,
            title: input.isExternal ? 'Tentativa de acesso RDP externo' : 'Intrusão RDP detectada',
            description: `${input.sourceIp} tentou acesso remoto (RDP) a ${input.targetIp}. ${attempts} tentativas falhas detectadas.`,
            sourceIp: input.sourceIp,
            targetIp: input.targetIp,
            targetPort: COMMON_PORTS.RDP,
            deviceType: DeviceType.COMPUTER,
            remediation: 'Desabilite RDP externo, use VPN, habilite NLA e autenticação multifator.',
          }),
        );
      }
    }

    if (
      input.targetPort === COMMON_PORTS.SSH &&
      input.eventType === 'firewall_block' &&
      input.isExternal
    ) {
      threats.push(
        ThreatEvent.create({
          type: ThreatType.SSH_BRUTE_FORCE,
          severity: VulnerabilitySeverity.HIGH,
          status: ThreatStatus.ACTIVE,
          title: 'Tentativa SSH bloqueada de IP externo',
          description: `Firewall bloqueou tentativa SSH de ${input.sourceIp} para ${input.targetIp ?? 'host interno'}.`,
          sourceIp: input.sourceIp,
          targetIp: input.targetIp,
          targetPort: COMMON_PORTS.SSH,
          remediation: 'Mantenha SSH fechado externamente, use VPN e chaves públicas.',
        }),
      );
    }

    if (input.targetPort === COMMON_PORTS.SSH || input.eventType === 'ssh_brute_force') {
      const attempts = input.failedAttempts ?? 0;
      if (attempts >= THREAT_THRESHOLDS.MAX_FAILED_SSH_ATTEMPTS) {
        threats.push(
          ThreatEvent.create({
            type: ThreatType.SSH_BRUTE_FORCE,
            severity: VulnerabilitySeverity.HIGH,
            status: ThreatStatus.ACTIVE,
            title: 'Ataque brute-force SSH detectado',
            description: `${input.sourceIp} realizou ${attempts} tentativas de login SSH em ${input.targetIp ?? 'múltiplos hosts'}.`,
            sourceIp: input.sourceIp,
            targetIp: input.targetIp,
            targetPort: COMMON_PORTS.SSH,
            remediation: 'Desabilite login root via SSH, use chaves públicas, configure fail2ban e limite IPs autorizados.',
          }),
        );
      }
    }

    return threats;
  }

  private detectPortScanning(input: NetworkEventInput): ThreatEvent[] {
    if (input.eventType !== 'port_scan') return [];

    return [
      ThreatEvent.create({
        type: ThreatType.PORT_SCAN_DETECTED,
        severity: VulnerabilitySeverity.MEDIUM,
        status: ThreatStatus.INVESTIGATING,
        title: 'Varredura de portas detectada na rede',
        description: `${input.sourceIp} está realizando varredura de portas na rede interna.`,
        sourceIp: input.sourceIp,
        remediation: 'Identifique o dispositivo responsável, verifique se é scan autorizado ou atividade maliciosa.',
      }),
    ];
  }

  private detectUnauthorizedDevices(input: NetworkEventInput): ThreatEvent[] {
    if (input.eventType !== 'unknown_device') return [];

    return [
      ThreatEvent.create({
        type: ThreatType.UNAUTHORIZED_DEVICE,
        severity: VulnerabilitySeverity.HIGH,
        status: ThreatStatus.ACTIVE,
        title: 'Dispositivo não autorizado na rede',
        description: `Novo dispositivo ${input.sourceIp} detectado sem registro prévio.`,
        sourceIp: input.sourceIp,
        remediation: 'Identifique o dispositivo, verifique MAC address e bloqueie se não autorizado.',
      }),
    ];
  }

  private detectLateralMovement(input: NetworkEventInput): ThreatEvent[] {
    if (input.eventType !== 'lateral_movement') return [];

    return [
      ThreatEvent.create({
        type: ThreatType.LATERAL_MOVEMENT,
        severity: VulnerabilitySeverity.CRITICAL,
        status: ThreatStatus.ACTIVE,
        title: 'Movimentação lateral detectada',
        description: `${input.sourceIp} está acessando múltiplos hosts internos — possível comprometimento em progresso.`,
        sourceIp: input.sourceIp,
        targetIp: input.targetIp,
        remediation: 'Isole o dispositivo imediatamente, analise logs e execute scan completo de vulnerabilidades.',
      }),
    ];
  }
}
