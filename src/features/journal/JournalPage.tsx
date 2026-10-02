import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useRequiredUser } from '../../auth/AuthProvider';
import { KpiCard } from '../../components/KpiCard';
import { LoadError, Panel, Spinner } from '../../components/Panel';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, TrashIcon } from '../../components/icons';
import { friendlyError } from '../../lib/errors';
import {
  centsToInput,
  errorMessage,
  formatDate,
  formatLongDate,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  ISO_DATE,
  parseAmountToCents,
  parseLocalDate,
  shiftIsoDate,
  todayIso,
} from '../../lib/format';
import { inputClass, primaryButtonClass } from '../../lib/styles';
import { useJournal, type JournalEntry } from './useJournal';

type Result = 'profit' | 'loss' | 'flat';

function tone(cents: number): string {
  if (cents > 0) return 'text-gain';
  if (cents < 0) return 'text-loss';
  return 'text-fg';
}

function computeStats(entries: JournalEntry[], today: string) {
  const monthKey = today.slice(0, 7);
  const month = entries.filter((e) => e.date.startsWith(monthKey));
  const monthPnl = month.reduce((sum, e) => sum + e.pnlCents, 0);
  const greenDays = month.filter((e) => e.pnlCents > 0).length;
  const redDays = month.filter((e) => e.pnlCents < 0).length;

  const dates = new Set(entries.map((e) => e.date));
  let cursor = dates.has(today) ? today : shiftIsoDate(today, -1);
  let streak = 0;
  for (let i = 0; i < 3660; i++) {
    if (dates.has(cursor)) streak++;
    else {
      const dow = parseLocalDate(cursor).getDay();
      if (dow !== 0 && dow !== 6) break;
    }
    cursor = shiftIsoDate(cursor, -1);
  }

  return { monthDays: month.length, monthPnl, greenDays, redDays, streak };
}

export function JournalPage() {
  const user = useRequiredUser();
  const search = useSearch({ strict: false }) as { date?: string };
  const today = todayIso();
  const { entries, status, loadError, reload, saveDay, deleteDay } = useJournal(user.id);
  const [date, setDate] = useState(() => (search.date && ISO_DATE.test(search.date) ? search.date : today));
  const [savedDate, setSavedDate] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<JournalEntry | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (search.date && ISO_DATE.test(search.date)) setDate(search.date);
  }, [search.date]);

  useEffect(() => {
    if (!savedDate) return;
    const t = setTimeout(() => setSavedDate(null), 3000);
    return () => clearTimeout(t);
  }, [savedDate]);

  const stats = useMemo(() => computeStats(entries, today), [entries, today]);
  const existing = entries.find((e) => e.date === date) ?? null;
  const isToday = date === today;

  const editDay = (entry: JournalEntry) => {
    setDate(entry.date);
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <header>
        <p className="text-xs font-semibold tracking-[0.18em] text-sky-600 uppercase">Daily log</p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Trading journal
        </h1>
        <p className="mt-1 text-sm text-muted">Tap Profit or Loss, enter the number, save. Takes under a minute.</p>
      </header>

      {status === 'loading' && <Spinner label="Loading your journal…" />}
      {status === 'error' && (
        <div className="mt-8">
          <LoadError message={friendlyError(loadError)} onRetry={reload} />
        </div>
      )}

      {status === 'ready' && (
        <>
          {/* Action first */}
          <div ref={formTopRef} className="mt-6 scroll-mt-24">
            <section className="rounded-2xl border border-sky-400/30 bg-panel p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-fg">
                    {existing ? 'Update this day' : isToday ? 'How did today go?' : 'Log this day'}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">{formatLongDate(date)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDate((d) => shiftIsoDate(d, -1))}
                    className="rounded-xl border border-line p-2.5 text-muted bg-hover"
                    aria-label="Previous day"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <input
                    type="date"
                    value={date}
                    max={today}
                    onChange={(e) => ISO_DATE.test(e.target.value) && setDate(e.target.value)}
                    className="min-h-10 rounded-xl border border-line bg-input px-2.5 py-2 text-sm text-fg focus:border-sky-400/60 focus:outline-none"
                    aria-label="Journal date"
                  />
                  <button
                    type="button"
                    onClick={() => setDate((d) => shiftIsoDate(d, 1))}
                    disabled={date >= today}
                    className="rounded-xl border border-line p-2.5 text-muted bg-hover disabled:opacity-30"
                    aria-label="Next day"
                  >
                    <ChevronRightIcon />
                  </button>
                  {!isToday && (
                    <button
                      type="button"
                      onClick={() => setDate(today)}
                      className="rounded-xl bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-700"
                    >
                      Today
                    </button>
                  )}
                </div>
              </div>

              <JournalDayForm
                key={`${date}:${existing?.id ?? 'new'}`}
                existing={existing}
                saved={savedDate === date}
                onSave={async (pnlCents, notes) => {
                  await saveDay(date, pnlCents, notes);
                  setSavedDate(date);
                }}
                onDelete={existing ? () => setPendingDelete(existing) : undefined}
              />
            </section>
          </div>

          <section aria-label="Journal stats" className="mt-3 grid grid-cols-3 gap-3">
            <KpiCard
              label="This month"
              basis="before"
              value={formatMoney(stats.monthPnl)}
              valueClassName={tone(stats.monthPnl)}
              hint={`${stats.monthDays} days logged`}
            />
            <KpiCard
              label="Win rate"
              value={stats.monthDays ? formatPercent(stats.greenDays / stats.monthDays, false) : '—'}
              hint={`${stats.greenDays} up · ${stats.redDays} down`}
            />
            <KpiCard
              label="Streak"
              value={`${stats.streak}d`}
              valueClassName={stats.streak > 0 ? 'text-amber-600' : 'text-subtle'}
              hint="Weekends OK"
            />
          </section>

          <Panel title="Past days" subtitle="Before tax" className="mt-3">
            {entries.length === 0 ? (
              <EmptyState
                title="Nothing logged yet"
                body="Save today’s result above. Your history will show up here."
              />
            ) : (
              <ul className="space-y-2">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
                      entry.date === date ? 'border-sky-400/40 bg-sky-500/5' : 'border-line bg-chip'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => editDay(entry)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm font-medium text-fg">{formatDate(entry.date)}</p>
                      <p className="truncate text-xs text-subtle">
                        {entry.notes || parseLocalDate(entry.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </button>
                    <p className={`font-money shrink-0 text-sm font-semibold ${tone(entry.pnlCents)}`}>
                      {formatSignedMoney(entry.pnlCents)}
                    </p>
                    <button
                      type="button"
                      onClick={() => editDay(entry)}
                      aria-label={`Edit ${formatDate(entry.date)}`}
                      className="rounded-lg p-2 text-muted bg-hover"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(entry)}
                      aria-label={`Delete ${formatDate(entry.date)}`}
                      className="rounded-lg p-2 text-muted hover:bg-rose-500/10 hover:text-rose-600"
                    >
                      <TrashIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this day?"
        description={
          pendingDelete
            ? `${formatLongDate(pendingDelete.date)} · ${formatSignedMoney(pendingDelete.pnlCents)}`
            : undefined
        }
        confirmLabel="Delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await deleteDay(pendingDelete.id);
        }}
      />
    </>
  );
}

const RESULT_OPTIONS: { value: Result; label: string; active: string }[] = [
  { value: 'profit', label: 'Profit', active: 'border-emerald-400 bg-emerald-400 text-emerald-950' },
  { value: 'loss', label: 'Loss', active: 'border-rose-400 bg-rose-400 text-rose-950' },
  { value: 'flat', label: 'Even', active: 'border-slate-300 bg-slate-200 text-slate-900' },
];

function JournalDayForm({
  existing,
  saved,
  onSave,
  onDelete,
}: {
  existing: JournalEntry | null;
  saved: boolean;
  onSave: (pnlCents: number, notes: string) => Promise<void>;
  onDelete?: () => void;
}) {
  const ids = { amount: useId(), notes: useId() };
  const [result, setResult] = useState<Result>(
    !existing ? 'profit' : existing.pnlCents > 0 ? 'profit' : existing.pnlCents < 0 ? 'loss' : 'flat',
  );
  const [amount, setAmount] = useState(existing && existing.pnlCents !== 0 ? centsToInput(existing.pnlCents) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    let pnl = 0;
    if (result !== 'flat') {
      const cents = parseAmountToCents(amount);
      if (cents === null) {
        setAmountError('Enter a number greater than 0, like 250');
        return;
      }
      pnl = result === 'loss' ? -cents : cents;
    }
    setAmountError(null);
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(pnl, notes.trim());
    } catch (err) {
      setSaveError(friendlyError(err) || errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Day result">
        {RESULT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={result === opt.value}
            onClick={() => setResult(opt.value)}
            className={`min-h-12 rounded-xl border text-sm font-bold transition ${
              result === opt.value ? opt.active : 'border-line text-muted bg-hover'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {result !== 'flat' && (
        <div>
          <label htmlFor={ids.amount} className="mb-2 block text-sm font-medium text-muted">
            {result === 'loss' ? 'How much did you lose?' : 'How much did you make?'}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-subtle">
              {result === 'loss' ? '−$' : '$'}
            </span>
            <input
              id={ids.amount}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              autoFocus={!existing}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} min-h-12 pl-10 text-lg font-money`}
              aria-invalid={!!amountError}
            />
          </div>
          {amountError && <p className="mt-1.5 text-sm text-rose-300">{amountError}</p>}
        </div>
      )}

      <div>
        <label htmlFor={ids.notes} className="mb-2 block text-sm font-medium text-muted">
          Notes <span className="font-normal text-subtle">(optional)</span>
        </label>
        <textarea
          id={ids.notes}
          rows={3}
          maxLength={5000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What worked? What will you do differently?"
          className={`${inputClass} resize-y`}
        />
      </div>

      {saveError && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{saveError}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className={`${primaryButtonClass} min-h-12 px-6 text-base`}>
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Save day'}
        </button>
        {saved && <span className="text-sm font-medium text-gain">Saved ✓</span>}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto rounded-xl px-3 py-2 text-sm text-muted hover:bg-rose-500/10 hover:text-rose-600"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
