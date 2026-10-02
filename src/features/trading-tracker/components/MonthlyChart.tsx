import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { MonthBucket } from '../calc';
import { TAX_RATE_LABEL } from '../calc';
import { formatCompactMoney, formatMoney, formatMonth } from '../../../lib/format';

type SeriesKey = 'moneyIn' | 'moneyOut' | 'net' | 'netAfterTax';

const SERIES: { key: SeriesKey; label: string; bar: string; dot: string; text: string }[] = [
  { key: 'moneyIn', label: 'Money In (before tax)', bar: 'bg-emerald-400', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  { key: 'moneyOut', label: 'Money Out (before tax)', bar: 'bg-rose-400', dot: 'bg-rose-400', text: 'text-rose-300' },
  { key: 'net', label: 'Net (before tax)', bar: 'bg-sky-400', dot: 'bg-sky-400', text: 'text-sky-300' },
  { key: 'netAfterTax', label: 'Net (after tax)', bar: 'bg-violet-400', dot: 'bg-violet-400', text: 'text-violet-300' },
];

const MIN_STEP_CENTS = 100;

function niceStep(raw: number): number {
  const exponent = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / exponent;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * exponent;
}

function buildScale(maxValue: number, minValue: number) {
  const span = maxValue - minValue || 10_000;
  const step = Math.max(MIN_STEP_CENTS, niceStep(span / 4));
  const bottom = Math.floor(minValue / step) * step;
  let top = Math.ceil(maxValue / step) * step;
  if (top === bottom) top = bottom + step;

  const ticks: number[] = [];
  for (let v = bottom; v <= top; v += step) ticks.push(v);

  const pct = (v: number) => ((v - bottom) / (top - bottom)) * 100;
  return { ticks, pct };
}

export function MonthlyChart({ months }: { months: MonthBucket[] }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scale = useMemo(() => {
    const values = months.flatMap((m) => SERIES.map((s) => m[s.key]));
    return buildScale(Math.max(0, ...values), Math.min(0, ...values));
  }, [months]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [months.length]);

  if (months.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
        Add an entry to see your monthly breakdown.
      </div>
    );
  }

  const active = months.find((m) => m.key === activeKey) ?? months[months.length - 1];
  const zero = scale.pct(0);

  const barStyle = (value: number): CSSProperties => {
    const p = scale.pct(value);
    return {
      bottom: `${Math.min(p, zero)}%`,
      height: `${Math.abs(p - zero)}%`,
      minHeight: value === 0 ? 0 : 2,
    };
  };

  return (
    <div>
      <div className="flex">
        <div className="relative h-56 w-14 shrink-0 sm:h-64" aria-hidden>
          {scale.ticks.map((t) => (
            <span
              key={t}
              className="absolute right-2 translate-y-1/2 text-[10px] text-slate-500 tabular-nums"
              style={{ bottom: `${scale.pct(t)}%` }}
            >
              {formatCompactMoney(t)}
            </span>
          ))}
        </div>

        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto pb-1">
          <div style={{ minWidth: months.length * 76 }}>
            <div className="relative h-56 sm:h-64">
              {scale.ticks.map((t) => (
                <div
                  key={t}
                  className={`absolute inset-x-0 border-t ${t === 0 ? 'border-white/25' : 'border-white/[0.05]'}`}
                  style={{ bottom: `${scale.pct(t)}%` }}
                />
              ))}
              <div className="absolute inset-0 flex">
                {months.map((m) => {
                  const isActive = m.key === active.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onMouseEnter={() => setActiveKey(m.key)}
                      onFocus={() => setActiveKey(m.key)}
                      onClick={() => setActiveKey(m.key)}
                      aria-label={`${formatMonth(m.key)}: ${SERIES.map((s) => `${s.label} ${formatMoney(m[s.key])}`).join(', ')}`}
                      className={`flex flex-1 items-stretch justify-center gap-1 rounded-lg px-2 transition focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:outline-none ${
                        isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {SERIES.map((s) => (
                        <span key={s.key} className="relative h-full w-full max-w-4">
                          <span
                            className={`absolute inset-x-0 rounded-[3px] ${s.bar} ${isActive ? 'opacity-100' : 'opacity-75'}`}
                            style={barStyle(m[s.key])}
                          />
                        </span>
                      ))}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex">
              {months.map((m) => (
                <span
                  key={m.key}
                  className={`flex-1 text-center text-[11px] ${m.key === active.key ? 'font-medium text-slate-200' : 'text-slate-500'}`}
                >
                  {formatMonth(m.key, 'short')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-xs font-medium text-slate-400">{formatMonth(active.key)}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {SERIES.map((s) => (
            <div key={s.key} className="min-w-0">
              <dt className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className={`size-2 shrink-0 rounded-full ${s.dot}`} />
                <span className="truncate">{s.label}</span>
              </dt>
              <dd className={`mt-0.5 text-sm font-semibold tabular-nums ${s.text}`}>
                {formatMoney(active[s.key])}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Money Out is shown as a positive bar. Net (after tax) sets aside {TAX_RATE_LABEL} for each month
        with a positive net; losing months get no tax credit. Hover or tap a month for exact values.
      </p>
    </div>
  );
}
