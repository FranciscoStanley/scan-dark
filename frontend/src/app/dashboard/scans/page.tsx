'use client';

import { useEffect, useState } from 'react';
import { api, Scan } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

const SCAN_TYPES = [
  { value: 'full_assessment', label: 'Avaliação Completa' },
  { value: 'network_discovery', label: 'Descoberta de Rede' },
  { value: 'port_scan', label: 'Varredura de Portas' },
  { value: 'iot_fingerprint', label: 'Fingerprint IoT' },
  { value: 'wifi_audit', label: 'Auditoria WiFi' },
  { value: 'router_audit', label: 'Auditoria Roteador' },
  { value: 'threat_monitor', label: 'Monitor de Ameaças' },
];

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'network_discovery', targetNetwork: '192.168.1.0', cidr: 24 });
  const loadScans = async () => {
    try {
      const data = await api.listScans();
      setScans(data);
    } catch {
      /* offline */
    }
  };

  useEffect(() => {
    loadScans();
    api.getNetworkDefaults().then((n) => {
      setForm((prev) => ({ ...prev, targetNetwork: n.network, cidr: n.cidr }));
    }).catch(() => {});

    const interval = setInterval(loadScans, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const scan = await api.createScan(form);
      setScans((prev) => [scan, ...prev]);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scans de Rede</h1>
          <p className="mt-1 text-[hsl(var(--text-secondary))]">Varreduras reais ICMP + TCP na sua LAN</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Novo Scan
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-[hsl(var(--text-secondary))]">Nome</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[hsl(var(--text-secondary))]">Tipo</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {SCAN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[hsl(var(--text-secondary))]">Rede</label>
            <input className="input" value={form.targetNetwork} onChange={(e) => setForm({ ...form, targetNetwork: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[hsl(var(--text-secondary))]">CIDR</label>
            <input type="number" className="input" value={form.cidr} onChange={(e) => setForm({ ...form, cidr: Number(e.target.value) })} min={8} max={32} />
          </div>
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Iniciando...' : 'Iniciar Scan'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {scans.length === 0 ? (
          <div className="card py-12 text-center text-[hsl(var(--text-secondary))]">Nenhum scan encontrado.</div>
        ) : (
          scans.map((scan) => (
            <div key={scan.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{scan.name}</p>
                  <p className="text-sm text-[hsl(var(--text-secondary))]">
                    {scan.targetNetwork} — {scan.type.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge severity={scan.status === 'completed' ? 'active' : scan.status === 'failed' ? 'critical' : 'medium'}>
                    {scan.status}
                  </Badge>
                  {(scan.status === 'running' || scan.status === 'pending') && (
                    <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${scan.progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
              {scan.status === 'completed' && scan.results && (
                <div className="mt-3 border-t border-white/5 pt-3">
                  <p className="text-sm text-[hsl(var(--text-secondary))]">
                    {scan.results.aliveHosts} host(s) ativo(s) de {scan.results.totalHostsScanned} verificados
                    {' '}em {(scan.results.durationMs / 1000).toFixed(1)}s
                  </p>
                  {scan.results.hosts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {scan.results.hosts.map((host) => (
                        <span
                          key={host.ipAddress}
                          className="rounded-lg bg-white/[0.04] px-2 py-1 font-mono text-xs text-[hsl(var(--text-secondary))]"
                          title={host.hostname}
                        >
                          {host.ipAddress}
                          {host.openPorts && host.openPorts.length > 0 && ` :${host.openPorts.join(',')}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
