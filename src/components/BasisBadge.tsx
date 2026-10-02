export type TaxBasis = 'before' | 'after';

export function BasisBadge({ basis }: { basis: TaxBasis }) {
  return basis === 'before' ? (
    <span className="inline-flex shrink-0 items-center rounded-md border border-cyan-500/25 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-cyan-600 uppercase [html[data-theme=dark]_&]:text-cyan-300">
      Before tax
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-700 uppercase [html[data-theme=dark]_&]:text-amber-300">
      After tax
    </span>
  );
}
