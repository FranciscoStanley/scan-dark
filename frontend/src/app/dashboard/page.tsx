'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Scan, Device, ThreatStats } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import {
  Activity,
  AlertTriangle,
  Camera,
  Radar,
  Shield,
  ArrowRight,
  Zap,
} from 'lucide-react';

export default function DashboardOverview() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<ThreatStats | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scanData, deviceData, statsData] = await Promise.all([
        api.listScans().catch(() => []),
        api.listDevices().catch(() => []),
        api.getThreatStats().catch(() => null),
      ]);
      setScans(scanData);
      setDevices(deviceData);
      if (statsData) setStats(statsData);
    } catch {
      /* services offline */
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-400">Security Operations Center</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-[hsl(var(--text-secondary))]">
            Visão em tempo real da segurança da sua rede
          </p>
        </div>
        <Link href="/dashboard/scans" className="btn-primary">
          <Radar className="h-4 w-4" />
          Novo Scan
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ameaças Ativas"
          value={stats?.activeThreats ?? 0}
          icon={AlertTriangle}
          variant="danger"
          trend="Monitoramento em tempo real"
        />
        <StatCard
          label="Críticas"
          value={stats?.criticalThreats ?? 0}
          icon={Zap}
          variant="danger"
        />
        <StatCard
          label="Dispositivos"
          value={devices.length}
          icon={Activity}
          variant="success"
        />
        <StatCard
          label="Scans"
          value={scans.length}
          icon={Radar}
          variant="default"
        />
      </div>

      {(stats?.cameraIntrusions ?? 0) > 0 && (
        <div className="card border-red-500/20 bg-red-500/[0.04]">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-red-500/10 p-3">
              <Camera className="h-6 w-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-400">Intrusão em câmera WiFi detectada</h3>
              <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
                {stats?.cameraIntrusions} tentativa(s) de acesso não autorizado a câmeras RTSP.
              </p>
            </div>
            <Link href="/dashboard/threats" className="btn-danger">
              Investigar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Scans Recentes</h2>
            <Link href="/dashboard/scans" className="text-sm text-emerald-400 hover:underline">
              Ver todos
            </Link>
          </div>
          {scans.length === 0 ? (
            <p className="py-8 text-center text-sm text-[hsl(var(--text-secondary))]">
              Nenhum scan realizado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {scans.slice(0, 4).map((scan) => (
                <div key={scan.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="font-medium">{scan.name}</p>
                    <p className="text-xs text-[hsl(var(--text-secondary))]">{scan.targetNetwork}</p>
                  </div>
                  <span className="badge-active text-[10px]">{scan.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Proteção Ativa</h2>
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Detecção de câmeras WiFi', status: 'Ativo' },
              { label: 'Monitoramento RDP/SSH', status: 'Ativo' },
              { label: 'Fingerprint IoT', status: 'Ativo' },
              { label: 'Auditoria de roteador', status: 'Ativo' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--text-secondary))]">{item.label}</span>
                <span className="badge-active">{item.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
