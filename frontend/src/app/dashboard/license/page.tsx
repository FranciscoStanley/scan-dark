'use client';

import { useEffect, useState } from 'react';
import { KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { api, LicenseStatus } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export default function LicensePage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await api.getLicenseStatus();
      setStatus(data);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Erro ao carregar licença');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const data = await api.activateLicense(licenseKey.trim());
      setStatus(data);
      setMessage('Licença ativada com sucesso.');
      setLicenseKey('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Falha na ativação');
    } finally {
      setBusy(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Licença de uso</h1>
        <p className="text-[hsl(var(--text-secondary))]">
          Status da licença comercial desta instalação ScanDark
        </p>
      </div>

      {status && (
        <div className="card space-y-4 p-6">
          <div className="flex items-center gap-3">
            {status.isActive ? (
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-red-400" />
            )}
            <div>
              <p className="font-semibold">{status.organizationName}</p>
              <p className="text-sm text-[hsl(var(--text-secondary))]">
                {status.isActive ? 'Licença ativa' : 'Licença inativa ou expirada'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[hsl(var(--text-secondary))]">Chave</p>
              <p className="font-mono">{status.licenseKey}</p>
            </div>
            <div>
              <p className="text-[hsl(var(--text-secondary))]">Expira em</p>
              <p>{new Date(status.expiresAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-[hsl(var(--text-secondary))]">Dias restantes</p>
              <p>{status.daysRemaining}</p>
            </div>
            <div>
              <p className="text-[hsl(var(--text-secondary))]">Usuários máx.</p>
              <p>{status.maxUsers}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-[hsl(var(--text-secondary))]">Recursos</p>
            <div className="flex flex-wrap gap-2">
              {status.features.map((f) => (
                <span key={f} className="rounded-lg bg-white/5 px-3 py-1 text-xs">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="card space-y-4 p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold">Ativar nova licença</h2>
          </div>
          <input
            className="input w-full font-mono"
            placeholder="SCANDARK-XXXX-XXXX-XXXX"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
          />
          <button onClick={handleActivate} className="btn-primary" disabled={busy}>
            {busy ? 'Ativando...' : 'Ativar licença'}
          </button>
        </div>
      )}

      {message && (
        <p className="text-center text-sm text-[hsl(var(--text-secondary))]">{message}</p>
      )}
    </div>
  );
}
