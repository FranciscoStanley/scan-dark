'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { api, Vulnerability, Scan } from '@/lib/api';
import { Badge } from '@/components/ui/badge';


export default function VulnerabilitiesPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState('');
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [summary, setSummary] = useState<{
    critical: number;
    high: number;
    medium: number;
    low: number;
    avgRisk: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadScans = async () => {
    const data = await api.listScans();
    setScans(data.filter((s) => s.status === 'completed'));
    if (data.length && !selectedScan) {
      const first = data.find((s) => s.status === 'completed');
      if (first) setSelectedScan(first.id);
    }
  };

  const loadVulnerabilities = async (scanId: string) => {
    if (!scanId) return;
    setBusy(true);
    try {
      const devices = await api.listDevicesByScan(scanId);
      const allVulns: Vulnerability[] = [];
      for (const device of devices) {
        const vulns = await api.getVulnerabilitiesByDevice(device.id);
        allVulns.push(...vulns);
      }
      setVulnerabilities(allVulns);

      const sum = await api.getVulnerabilitySummary(scanId);
      setSummary({
        critical: sum.criticalVulnerabilities,
        high: sum.highVulnerabilities,
        medium: sum.mediumVulnerabilities,
        low: sum.lowVulnerabilities,
        avgRisk: sum.averageRiskScore,
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadScans().catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedScan) loadVulnerabilities(selectedScan).catch(console.error);
  }, [selectedScan]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vulnerabilidades</h1>
          <p className="text-[hsl(var(--text-secondary))]">
            CVEs e riscos detectados nos dispositivos da rede
          </p>
        </div>
        <button
          onClick={() => selectedScan && loadVulnerabilities(selectedScan)}
          className="btn-secondary"
          disabled={busy}
        >
          <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="card p-4">
        <label className="text-sm text-[hsl(var(--text-secondary))]">Scan</label>
        <select
          className="input mt-2 w-full max-w-md"
          value={selectedScan}
          onChange={(e) => setSelectedScan(e.target.value)}
        >
          <option value="">Selecione um scan concluído</option>
          {scans.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.targetNetwork}
            </option>
          ))}
        </select>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: 'Críticas', value: summary.critical, color: 'text-red-400' },
            { label: 'Altas', value: summary.high, color: 'text-orange-400' },
            { label: 'Médias', value: summary.medium, color: 'text-yellow-400' },
            { label: 'Baixas', value: summary.low, color: 'text-emerald-400' },
            { label: 'Risco médio', value: summary.avgRisk, color: 'text-white' },
          ].map((item) => (
            <div key={item.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-[hsl(var(--text-secondary))]">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {vulnerabilities.length === 0 && !busy && (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <ShieldAlert className="h-10 w-10 text-[hsl(var(--text-secondary))]" />
            <p className="text-[hsl(var(--text-secondary))]">
              Nenhuma vulnerabilidade encontrada. Execute um scan do tipo Full Assessment ou IoT
              Fingerprint.
            </p>
          </div>
        )}
        {vulnerabilities.map((v) => (
          <div key={v.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{v.title}</h3>
                  <Badge severity={v.severity}>{v.severity}</Badge>
                  {v.cveId && (
                    <span className="text-xs text-[hsl(var(--text-secondary))]">{v.cveId}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[hsl(var(--text-secondary))]">{v.description}</p>
                <p className="mt-3 text-sm">
                  <span className="text-emerald-400">Remediação:</span> {v.remediation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
