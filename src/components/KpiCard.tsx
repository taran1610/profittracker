import type { ReactNode } from 'react';
import { BasisBadge, type TaxBasis } from './BasisBadge';

interface KpiCardProps {
  label: string;
  /** Omit for non-money metrics (e.g. win rate) where tax doesn't apply. */
  basis?: TaxBasis;
  value: string;
  valueClassName?: string;
  /** Tailwind `via-*` color for the thin accent line on top of the card. */
  accentClassName: string;
  hint?: ReactNode;
  className?: string;
}

export function KpiCard({
  label,
  basis,
  value,
  valueClassName = 'text-white',
  accentClassName,
  hint,
  className = '',
}: KpiCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-linear-to-b from-[#0d1628] to-[#090f1c] p-4 sm:p-5 ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent ${accentClassName}`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        {basis && <BasisBadge basis={basis} />}
      </div>
      <p
        className={`mt-3 truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl ${valueClassName}`}
        title={value}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}
