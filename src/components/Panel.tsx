import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, subtitle, actions, children, className = 'mt-6' }: PanelProps) {
  return (
    <section className={`rounded-2xl border border-white/[0.06] bg-[#0a101d]/80 p-4 sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-500/5 p-4 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between">
      <span>Couldn't load your data: {message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-rose-300/30 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/10"
      >
        Try again
      </button>
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
      {label}
    </div>
  );
}
