export type TaxBasis = 'before' | 'after';

export function BasisBadge({ basis }: { basis: TaxBasis }) {
  return basis === 'before' ? (
    <span className="inline-flex shrink-0 items-center rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-300 uppercase">
      Before tax
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-violet-200 uppercase">
      After tax
    </span>
  );
}
