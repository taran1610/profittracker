import type { ReactNode } from 'react';
import { BasisBadge, type TaxBasis } from './BasisBadge';

interface KpiCardProps {
  label: string;
  basis?: TaxBasis;
  value: string;
  valueClassName?: string;
  hint?: ReactNode;
  className?: string;
  size?: 'sm' | 'lg';
}

export function KpiCard({
  label,
  basis,
  value,
  valueClassName = 'text-fg',
  hint,
  className = '',
  size = 'sm',
}: KpiCardProps) {
  return (
    <div className={`rounded-2xl border border-line bg-panel p-4 sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-subtle uppercase">{label}</p>
        {basis && <BasisBadge basis={basis} />}
      </div>
      <p
        className={`font-money mt-3 tracking-tight ${size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'} ${valueClassName}`}
        title={value}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-snug text-subtle">{hint}</p>}
    </div>
  );
}
