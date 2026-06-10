import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'danger' | 'success' | 'warning';
}

const variants = {
  default: 'text-cyan-400',
  danger: 'text-red-400 stat-glow-red',
  success: 'text-emerald-400 stat-glow-emerald',
  warning: 'text-amber-400',
};

export function StatCard({ label, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className="card group animate-fade-in transition-all hover:border-white/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[hsl(var(--text-secondary))]">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {trend && <p className="mt-1 text-xs text-[hsl(var(--text-secondary))]">{trend}</p>}
        </div>
        <div className={clsx('rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/[0.06]', variants[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
