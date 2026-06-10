export interface HostPortFinding {
  targetIp: string;
  targetPort: number;
  protocol: string;
  service: string;
}

export interface INetworkProbe {
  probeNetwork(network: string, cidr: number): Promise<HostPortFinding[]>;
}

export const NETWORK_PROBE = Symbol('NETWORK_PROBE');
