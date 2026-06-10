'use client';

import { useEffect, useState } from 'react';
import { api, ThreatEvent, ThreatStats, IngestionStatus } from '@/lib/api';
import { getStoredMonitorNetwork, saveMonitorNetwork } from '@/lib/network-settings';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Camera,
  Monitor,
  Shield,
  RefreshCw,
  CheckCircle,
  Globe,
  Building2,
  Radar,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';

export default function ThreatsPage() {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [stats, setStats] = useState<ThreatStats | null>(null);
  const [ingestion, setIngestion] = useState<IngestionStatus | null>(null);
  const [network, setNetwork] = useState('192.168.1.0');
  const [cidr, setCidr] = useState(24);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const refreshList = async () => {
    setLoading(true);
    try {
      const [events, statsData, ingestionData] = await Promise.all([
        api.listActiveThreats(),
        api.getThreatStats(),
        api.getIngestionStatus(),
      ]);
      setThreats(events);
      setStats(statsData);
      setIngestion(ingestionData);
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  };

  const runScan = async () => {
    setScanning(true);
    try {
      saveMonitorNetwork({ network, cidr });
      await api.monitorThreats(network, cidr);
      await refreshList();
    } catch {
      /* offline */
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const stored = getStoredMonitorNetwork();
      if (stored) {
        setNetwork(stored.network);
        setCidr(stored.cidr);
      } else {
        try {
          const defaults = await api.getNetworkDefaults();
          setNetwork(defaults.network);
          setCidr(defaults.cidr);
        } catch {
          /* use fallback */
        }
      }
      await refreshList();
    };
    init();
  }, []);

  const handleResolve = async (id: string) => {
    await api.resolveThreat(id);
    await refreshList();
  };

  const busy = loading || scanning;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-red-400">Threat Intelligence</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Centro de Ameaças</h1>
          <p className="mt-1 text-[hsl(var(--text-secondary))]">
            Varredura real da rede local e ingestão de logs do firewall
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refreshList} className="btn-secondary" disabled={busy}>
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            Atualizar
          </button>
          <button onClick={runScan} className="btn-primary" disabled={busy}>
            <Radar className={clsx('h-4 w-4', scanning && 'animate-spin')} />
            Varredura
          </button>
        </div>
      </div>

      <div className="card grid gap-4 md:grid-cols-[1fr_120px_auto] md:items-end">
        <div>
          <label className="text-xs font-medium text-[hsl(var(--text-secondary))]">
            Rede para monitorar
          </label>
          <input
            className="input mt-1 w-full font-mono"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            placeholder="192.168.1.0"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[hsl(var(--text-secondary))]">CIDR</label>
          <input
            className="input mt-1 w-full font-mono"
            type="number"
            min={16}
            max={30}
            value={cidr}
            onChange={(e) => setCidr(Number(e.target.value))}
          />
        </div>
        <p className="text-xs text-[hsl(var(--text-secondary))] md:pb-2">
          Ex.: {network}/{cidr}
        </p>
      </div>

      {ingestion && (
        <div className="card flex flex-wrap items-center gap-3 text-sm">
          <FileText className="h-4 w-4 text-sky-400" />
          <span className="font-medium">Ingestão de firewall</span>
          <Badge severity={ingestion.watching ? 'active' : 'medium'}>
            {ingestion.watching ? 'Ativa' : ingestion.enabled ? 'Aguardando log' : 'Desabilitada'}
          </Badge>
          {ingestion.logPath && (
            <span className="text-xs text-[hsl(var(--text-secondary))]">{ingestion.logPath}</span>
          )}
          <span className="text-xs text-[hsl(var(--text-secondary))]">
            {ingestion.threatsCreated} ameaça(s) via logs · {ingestion.linesProcessed} linha(s)
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Ativas" value={stats?.activeThreats ?? 0} icon={AlertTriangle} variant="danger" />
        <StatCard label="Críticas" value={stats?.criticalThreats ?? 0} icon={Shield} variant="danger" />
        <StatCard label="Câmeras" value={stats?.cameraIntrusions ?? 0} icon={Camera} variant="warning" />
        <StatCard label="RDP/SSH" value={stats?.remoteAccessAttempts ?? 0} icon={Monitor} variant="warning" />
        <StatCard label="Bloqueadas" value={stats?.blockedAttempts ?? 0} icon={Shield} variant="success" />
        <StatCard label="Resolvidas Hoje" value={stats?.resolvedToday ?? 0} icon={CheckCircle} variant="success" />
      </div>

      <div className="space-y-4">
        {threats.length === 0 ? (
          <div className="card py-16 text-center">
            <Shield className="mx-auto h-12 w-12 text-emerald-400/50" />
            <p className="mt-4 font-medium">Nenhuma ameaça detectada</p>
            <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
              Execute uma varredura ou conecte os logs do firewall para detectar tentativas externas.
            </p>
          </div>
        ) : (
          threats.map((threat) => (
            <div
              key={threat.id}
              className={clsx(
                'card transition-all',
                threat.severity === 'critical' && 'border-red-500/20 bg-red-500/[0.02]',
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    'rounded-xl p-3',
                    threat.severity === 'critical' ? 'bg-red-500/10' : 'bg-amber-500/10',
                  )}
                >
                  {threat.type.includes('camera') || threat.type.includes('rtsp') ? (
                    <Camera className="h-5 w-5 text-red-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge severity={threat.severity} />
                    <Badge severity={threat.status}>{threat.status}</Badge>
                    <span className="text-xs text-[hsl(var(--text-secondary))]">
                      {new Date(threat.detectedAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold">{threat.title}</h3>
                  <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">{threat.description}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono text-[hsl(var(--text-secondary))]">
                    <span>Src: {threat.sourceIp}</span>
                    {threat.targetIp && <span>Dst: {threat.targetIp}</span>}
                    {threat.targetPort && <span>Port: {threat.targetPort}</span>}
                  </div>
                  {threat.sourceIpIntel && (
                    <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2 font-medium text-[hsl(var(--text-primary))]">
                        <Globe className="h-3.5 w-3.5 text-sky-400" />
                        <span>Origem do IP</span>
                        {threat.sourceIpIntel.isPrivate && (
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                            Rede interna
                          </span>
                        )}
                      </div>
                      <div className="mt-2 grid gap-1 text-[hsl(var(--text-secondary))] sm:grid-cols-2">
                        {threat.sourceIpIntel.country && (
                          <span>
                            Local: {[threat.sourceIpIntel.city, threat.sourceIpIntel.region, threat.sourceIpIntel.country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        )}
                        {threat.sourceIpIntel.organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {threat.sourceIpIntel.organization}
                          </span>
                        )}
                        {threat.sourceIpIntel.isp && <span>ISP: {threat.sourceIpIntel.isp}</span>}
                        {threat.sourceIpIntel.asn && <span>ASN: {threat.sourceIpIntel.asn}</span>}
                      </div>
                    </div>
                  )}
                  <p className="mt-3 text-sm text-emerald-400/80">
                    → {threat.remediation}
                  </p>
                </div>
                {threat.status === 'active' && (
                  <button onClick={() => handleResolve(threat.id)} className="btn-secondary shrink-0">
                    <CheckCircle className="h-4 w-4" />
                    Resolver
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
