'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Radar,
  AlertTriangle,
  Monitor,
  LogOut,
  ChevronRight,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/contexts/auth-context';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/threats', label: 'Ameaças', icon: AlertTriangle },
  { href: '/dashboard/scans', label: 'Scans', icon: Radar },
  { href: '/dashboard/devices', label: 'Dispositivos', icon: Monitor },
  { href: '/dashboard/vulnerabilities', label: 'Vulnerabilidades', icon: ShieldAlert },
  { href: '/dashboard/license', label: 'Licença', icon: KeyRound },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.06] bg-[hsl(var(--bg-surface))]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-bold tracking-tight">ScanDark</p>
            <p className="text-xs text-[hsl(var(--text-secondary))]">Security Platform</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(active ? 'sidebar-link-active' : 'sidebar-link')}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {active && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <div className="mb-3 rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-[hsl(var(--text-secondary))]">{user?.email}</p>
          </div>
          <button onClick={logout} className="btn-ghost w-full justify-start">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
