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
    <section className={`rounded-2xl border border-line bg-panel p-4 sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-fg">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-subtle">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5">
      <p className="font-display text-sm font-semibold text-fg">Couldn’t load this page</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl border border-line bg-chip px-4 py-2 text-sm font-semibold text-fg transition bg-hover"
      >
        Try again
      </button>
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-[var(--line)] border-t-sky-500" />
      {label}
    </div>
  );
}
