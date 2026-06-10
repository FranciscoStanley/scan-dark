import clsx from 'clsx';

const map: Record<string, string> = {
  critical: 'badge-critical',
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
  active: 'badge-active',
  resolved: 'badge-low',
  investigating: 'badge-medium',
};

export function Badge({ severity, children }: { severity: string; children?: React.ReactNode }) {
  return (
    <span className={clsx(map[severity] ?? 'badge-low')}>
      {children ?? severity}
    </span>
  );
}
