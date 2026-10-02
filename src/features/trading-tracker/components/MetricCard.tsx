import type { ReactNode } from 'react';
import { BasisBadge, type TaxBasis } from '../../../components/BasisBadge';

interface MetricCardProps {
  label: string;
  basis: TaxBasis;
  value: string;
  valueClassName?: string;
  hint: ReactNode;
}

export function MetricCard({
  label,
  basis,
  value,
  valueClassName = 'text-gain',
  hint,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <BasisBadge basis={basis} />
      </div>
      <p className={`font-money mt-3 text-2xl font-semibold tracking-tight sm:text-[1.65rem] ${valueClassName}`}>
        {value}
      </p>
      <p className="mt-1.5 text-xs text-subtle">{hint}</p>
    </div>
  );
}
