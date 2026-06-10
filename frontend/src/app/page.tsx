'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Radar,
  Camera,
  Wifi,
  ArrowRight,
  Lock,
  Eye,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) router.push('/dashboard');
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <nav className="relative z-10 border-b border-white/[0.06] bg-[hsl(var(--bg-base))]/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold">ScanDark</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost">Entrar</Link>
            <Link href="/register" className="btn-primary">Começar Grátis</Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400">
            <Zap className="h-3.5 w-3.5" />
            Enterprise Network Security
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
            Proteja cada dispositivo
            <br />
            <span className="gradient-text">da sua rede</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[hsl(var(--text-secondary))]">
            Detecte câmeras WiFi expostas, acessos remotos indevidos, dispositivos IoT vulneráveis
            e ameaças em tempo real — com a sofisticação que sua rede merece.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn-primary px-8 py-3.5 text-base">
              Iniciar Auditoria
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-secondary px-8 py-3.5 text-base">
              Ver Demo
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-24 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Camera, title: 'Câmeras WiFi', desc: 'Detecte acessos RTSP não autorizados e streams expostos' },
            { icon: Lock, title: 'Acesso Remoto', desc: 'Monitore RDP, SSH e tentativas de intrusão externa' },
            { icon: Eye, title: 'Threat Detection', desc: 'Motor IDS com alertas em tempo real' },
            { icon: Wifi, title: 'Auditoria WiFi', desc: 'WPA2/WPA3, WPS e isolamento de VLAN' },
            { icon: Radar, title: 'Port Scanning', desc: 'Varredura TCP completa com fingerprinting' },
            { icon: Shield, title: 'CVE Assessment', desc: 'Vulnerabilidades com remediação acionável' },
          ].map((f) => (
            <div key={f.title} className="glass-hover p-6">
              <f.icon className="mb-4 h-7 w-7 text-emerald-400" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--text-secondary))]">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
