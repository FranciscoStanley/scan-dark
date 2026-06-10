const STORAGE_KEY = 'scandark.monitor.network';

export interface MonitorNetworkSettings {
  network: string;
  cidr: number;
}

export function getStoredMonitorNetwork(): MonitorNetworkSettings | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MonitorNetworkSettings;
    if (parsed.network && parsed.cidr) return parsed;
  } catch {
    return null;
  }
  return null;
}

export function saveMonitorNetwork(settings: MonitorNetworkSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
