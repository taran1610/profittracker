import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useRequiredUser } from '../../auth/AuthProvider';
import { KpiCard } from '../../components/KpiCard';
import { LoadError, Panel, Spinner } from '../../components/Panel';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, TrashIcon } from '../../components/icons';
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
  if (cents > 0) return 'text-emerald-300';
  if (cents < 0) return 'text-rose-300';
  return 'text-slate-200';
}

function computeStats(entries: JournalEntry[], today: string) {
  const monthKey = today.slice(0, 7);
  const month = entries.filter((e) => e.date.startsWith(monthKey));
  const monthPnl = month.reduce((sum, e) => sum + e.pnlCents, 0);
  const allTimePnl = entries.reduce((sum, e) => sum + e.pnlCents, 0);
  const greenDays = month.filter((e) => e.pnlCents > 0).length;
  const redDays = month.filter((e) => e.pnlCents < 0).length;

  // Consecutive journaled days ending today (or yesterday); weekends without an entry don't break it.
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

  return { monthDays: month.length, monthPnl, allTimePnl, greenDays, redDays, streak };
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

  const editDay = (entry: JournalEntry) => {
    setDate(entry.date);
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Trading Journal</h1>
        <p className="mt-1 text-sm text-slate-400">
          Log each trading day's result (profit or loss) and what you learned.
        </p>
      </header>

      {status === 'loading' && <Spinner label="Loading your journal…" />}
      {status === 'error' && (
        <div className="mt-8">
          <LoadError message={loadError ?? 'Unknown error'} onRetry={reload} />
        </div>
      )}

      {status === 'ready' && (
        <>
          <section aria-label="Journal stats" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="This month's P&L"
              basis="before"
              value={formatMoney(stats.monthPnl)}
              valueClassName={tone(stats.monthPnl)}
              accentClassName="via-sky-400/70"
              hint={`${stats.monthDays} journaled ${stats.monthDays === 1 ? 'day' : 'days'}`}
            />
            <KpiCard
              label="All-time journal P&L"
              basis="before"
              value={formatMoney(stats.allTimePnl)}
              valueClassName={tone(stats.allTimePnl)}
              accentClassName="via-violet-400/70"
              hint={`${entries.length} ${entries.length === 1 ? 'day' : 'days'} total`}
            />
            <KpiCard
              label="Green days this month"
              value={stats.monthDays ? formatPercent(stats.greenDays / stats.monthDays, false) : '—'}
              accentClassName="via-emerald-400/70"
              hint={`${stats.greenDays} green · ${stats.redDays} red`}
            />
            <KpiCard
              label="Journal streak"
              value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`}
              valueClassName={stats.streak > 0 ? 'text-amber-300' : 'text-slate-500'}
              accentClassName="via-amber-400/70"
              hint="Weekends don't break it"
            />
          </section>

          <div ref={formTopRef} className="scroll-mt-24">
            <Panel
              title={existing ? 'Edit day' : 'Log a day'}
              subtitle={formatLongDate(date)}
              actions={
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDate((d) => shiftIsoDate(d, -1))}
                    className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5"
                    aria-label="Previous day"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <input
                    type="date"
                    value={date}
                    max={today}
                    onChange={(e) => ISO_DATE.test(e.target.value) && setDate(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#070c17] px-2.5 py-1.5 text-sm text-slate-200 focus:border-sky-400/60 focus:outline-none"
                    aria-label="Journal date"
                  />
                  <button
                    type="button"
                    onClick={() => setDate((d) => shiftIsoDate(d, 1))}
                    disabled={date >= today}
                    className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 disabled:opacity-30"
                    aria-label="Next day"
                  >
                    <ChevronRightIcon />
                  </button>
                  {date !== today && (
                    <button
                      type="button"
                      onClick={() => setDate(today)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-400/10"
                    >
                      Today
                    </button>
                  )}
                </div>
              }
            >
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
            </Panel>
          </div>

          <Panel title="History" subtitle="All amounts before tax">
            {entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
                No journal entries yet. Log today's result above.
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.04] overflow-hidden rounded-xl border border-white/[0.06]">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className={`flex items-start gap-3 p-3.5 sm:items-center sm:px-4 ${entry.date === date ? 'bg-sky-400/[0.04]' : ''}`}
                  >
                    <div className="w-24 shrink-0 sm:w-32">
                      <p className="text-sm text-slate-200 tabular-nums">{formatDate(entry.date)}</p>
                      <p className="text-[11px] text-slate-500">
                        {parseLocalDate(entry.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </div>
                    <p className={`w-28 shrink-0 text-right font-semibold tabular-nums sm:w-32 ${tone(entry.pnlCents)}`}>
                      {formatSignedMoney(entry.pnlCents)}
                    </p>
                    <p className="hidden min-w-0 flex-1 truncate text-sm text-slate-400 sm:block" title={entry.notes || undefined}>
                      {entry.notes || <span className="text-slate-600">No notes</span>}
                    </p>
                    <div className="ml-auto flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => editDay(entry)}
                        aria-label={`Edit ${formatDate(entry.date)}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(entry)}
                        aria-label={`Delete ${formatDate(entry.date)}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete journal day?"
        description={pendingDelete ? `${formatLongDate(pendingDelete.date)} · ${formatSignedMoney(pendingDelete.pnlCents)}` : undefined}
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
  { value: 'profit', label: 'Profit', active: 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200' },
  { value: 'loss', label: 'Loss', active: 'border-rose-400/60 bg-rose-400/10 text-rose-200' },
  { value: 'flat', label: 'Break-even', active: 'border-slate-400/60 bg-slate-400/10 text-slate-200' },
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
        setAmountError('Enter an amount greater than 0, e.g. 250 or 1,250.50.');
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
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-slate-400">How did the day go?</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {RESULT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={result === opt.value}
              onClick={() => setResult(opt.value)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                result === opt.value ? opt.active : 'border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={ids.amount} className="mb-1.5 block text-xs font-medium text-slate-400">
          {result === 'loss' ? 'Amount lost' : 'Amount made'} <span className="text-slate-500">(before tax)</span>
        </label>
        <div className="relative max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
            {result === 'loss' ? '−$' : '$'}
          </span>
          <input
            id={ids.amount}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={result === 'flat' ? '0.00' : 'e.g. 350'}
            disabled={result === 'flat'}
            value={result === 'flat' ? '' : amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} ${result === 'loss' ? 'pl-9' : 'pl-7'} tabular-nums`}
            aria-invalid={!!amountError}
          />
        </div>
        {amountError && <p className="mt-1 text-xs text-rose-300">{amountError}</p>}
      </div>

      <div>
        <label htmlFor={ids.notes} className="mb-1.5 block text-xs font-medium text-slate-400">
          Journal notes <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          id={ids.notes}
          rows={4}
          maxLength={5000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you trade? What went well, what didn't, and what will you do differently tomorrow?"
          className={`${inputClass} resize-y`}
        />
      </div>

      {saveError && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{saveError}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : existing ? 'Update day' : 'Save day'}
        </button>
        {saved && <span className="text-sm text-emerald-300">Saved</span>}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            Delete day
          </button>
        )}
      </div>
    </form>
  );
}
