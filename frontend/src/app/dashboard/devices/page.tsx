'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, Device, DiscoveredHost, Scan } from '@/lib/api';
import { Camera, Router, Smartphone, Monitor, Activity, Radar, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const icons: Record<string, typeof Camera> = {
  camera: Camera,
  router: Router,
  mobile: Smartphone,
  smart_tv: Monitor,
};

function hostsToDevices(hosts: DiscoveredHost[]): Device[] {
  return hosts
    .filter((h) => h.isAlive)
    .map((h) => ({
      id: h.ipAddress,
      ipAddress: h.ipAddress,
      hostname: h.hostname,
      deviceType: h.openPorts?.includes(554) ? 'camera' : 'unknown',
      openPorts: h.openPorts ?? [],
      riskScore: h.openPorts?.includes(554) ? 35 : 0,
    }));
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<number | null>(null);
  const [networkInfo, setNetworkInfo] = useState<string>('');
  const [lastScan, setLastScan] = useState<Scan | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      const data = await api.listDevices();
      setDevices(data);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadDevices();
      try {
        const defaults = await api.getNetworkDefaults();
        setNetworkInfo(
          `${defaults.network}/${defaults.cidr} (${defaults.source === 'auto-detected' ? 'detectada' : 'configurada'})`,
        );
      } catch {
        /* offline */
      }
      try {
        const scans = await api.listScans();
        const latest = scans.find((s) => s.status === 'completed' && s.results?.aliveHosts);
        if (latest) setLastScan(latest);
      } catch {
        /* offline */
      }
    };
    init();
  }, [loadDevices]);

  const pollScan = async (scanId: string): Promise<Scan | null> => {
    const maxAttempts = 180;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const scan = await api.getScan(scanId);
      setScanProgress(scan.progress);

      if (scan.status === 'completed' || scan.status === 'failed') {
        setLastScan(scan);
        return scan;
      }
    }
    return null;
  };

  const scanNetwork = async () => {
    setScanning(true);
    setScanProgress(0);
    try {
      const defaults = await api.getNetworkDefaults();
      const scan = await api.createScan({
        name: `Descoberta ${new Date().toLocaleString('pt-BR')}`,
        type: 'network_discovery',
        targetNetwork: defaults.network,
        cidr: defaults.cidr,
      });

      const completed = await pollScan(scan.id);
      if (!completed) return;

      try {
        await loadDevices();
      } catch {
        if (completed.results?.hosts) {
          setDevices(hostsToDevices(completed.results.hosts));
        }
      }
    } finally {
      setScanning(false);
      setScanProgress(null);
    }
  };

  const displayCount = devices.length;
  const scanHosts = lastScan?.results?.aliveHosts;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispositivos</h1>
          <p className="mt-1 text-[hsl(var(--text-secondary))]">
            Inventário real da rede{networkInfo ? ` — ${networkInfo}` : ''}
          </p>
          {scanHosts != null && scanHosts > 0 && (
            <p className="mt-1 text-sm text-emerald-400/80">
              Último scan: {scanHosts} host(s) ativo(s) na rede
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={loadDevices} className="btn-secondary" disabled={loading}>
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            Atualizar
          </button>
          <button onClick={scanNetwork} className="btn-primary" disabled={scanning}>
            <Radar className="h-4 w-4" />
            {scanning ? `Escaneando... ${scanProgress ?? 0}%` : 'Escanear Rede'}
          </button>
        </div>
      </div>

      {scanning && (
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${scanProgress ?? 0}%` }}
              />
            </div>
            <span className="text-sm text-[hsl(var(--text-secondary))]">{scanProgress ?? 0}%</span>
          </div>
          <p className="mt-2 text-sm text-[hsl(var(--text-secondary))]">
            Varredura ICMP + TCP + SSDP em andamento. Pode levar 1–3 minutos.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="card col-span-full py-12 text-center text-[hsl(var(--text-secondary))]">
            Carregando dispositivos...
          </div>
        ) : displayCount === 0 ? (
          <div className="card col-span-full py-12 text-center text-[hsl(var(--text-secondary))]">
            Nenhum dispositivo encontrado. Clique em &quot;Escanear Rede&quot; para descobrir hosts na sua LAN.
          </div>
        ) : (
          devices.map((device) => {
            const Icon = icons[device.deviceType] ?? Activity;
            return (
              <div key={device.id} className="glass-hover p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
                    <Icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{device.hostname ?? device.ipAddress}</p>
                    <p className="text-sm text-[hsl(var(--text-secondary))]">{device.ipAddress}</p>
                    <p className="mt-1 text-xs capitalize text-[hsl(var(--text-secondary))]">
                      {device.deviceType.replace(/_/g, ' ')}
                      {device.vendor && ` · ${device.vendor}`}
                    </p>
                    {device.openPorts.length > 0 && (
                      <p className="mt-2 font-mono text-xs text-[hsl(var(--text-secondary))]">
                        Portas: {device.openPorts.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={clsx(
                      'text-2xl font-bold',
                      device.riskScore >= 50 ? 'text-red-400' : device.riskScore >= 25 ? 'text-amber-400' : 'text-emerald-400',
                    )}>
                      {device.riskScore}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--text-secondary))]">Risk</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
