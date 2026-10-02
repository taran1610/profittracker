import { useMemo, useState } from 'react';
import type { Entry, EntryInput, EntryType } from './types';
import { TAX_RATE_LABEL, computeTotals, monthlyBreakdown, signedCents } from './calc';
import { formatDate, formatMoney, formatPercent, formatSignedMoney, todayIso } from '../../lib/format';
import { friendlyError } from '../../lib/errors';
import { useEntries } from './useEntries';
import { useRequiredUser } from '../../auth/AuthProvider';
import { LoadError, Spinner } from '../../components/Panel';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PlusIcon } from '../../components/icons';
import { MonthlyChart } from './components/MonthlyChart';
import { EntriesTable } from './components/EntriesTable';
import { EntryFormModal } from './components/EntryFormModal';
import { MetricCard } from './components/MetricCard';

type FormState = { mode: 'add'; type: EntryType } | { mode: 'edit'; entry: Entry } | null;

function signedTone(value: number): string {
  if (value > 0) return 'text-gain';
  if (value < 0) return 'text-loss';
  return 'text-gain';
}

export function TradingTrackerPage() {
  const user = useRequiredUser();
  const { entries, status, loadError, reload, addEntry, updateEntry, deleteEntry } = useEntries(user.id);
  const [form, setForm] = useState<FormState>(null);
  const [pendingDelete, setPendingDelete] = useState<Entry | null>(null);

  const totals = useMemo(() => computeTotals(entries), [entries]);
  const months = useMemo(() => monthlyBreakdown(entries), [entries]);

  const formInitial: EntryInput =
    form?.mode === 'edit'
      ? form.entry
      : { type: form?.type ?? 'payout', date: todayIso(), amountCents: 0, notes: '' };

  const handleSubmit = async (input: EntryInput) => {
    if (form?.mode === 'edit') await updateEntry(form.entry.id, input);
    else await addEntry(input);
    setForm(null);
  };

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-accent uppercase">
            Finance · Trading
          </p>
          <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Trading Tracker
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Payouts in, eval fees out. Tax set-aside of {TAX_RATE_LABEL} on positive net only.
          </p>
        </div>
        <button
          type="button"
          disabled={status === 'loading'}
          onClick={() => setForm({ mode: 'add', type: 'payout' })}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-50"
        >
          <PlusIcon /> Add entry
        </button>
      </header>

      {status === 'loading' && <Spinner label="Loading your money…" />}
      {status === 'error' && (
        <div className="mt-8">
          <LoadError message={friendlyError(loadError)} onRetry={reload} />
        </div>
      )}

      {status === 'ready' && (
        <>
          <section aria-label="Key metrics" className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-5">
            <MetricCard
              label="Total Money In"
              basis="before"
              value={formatMoney(totals.moneyIn)}
              valueClassName="text-gain"
              hint="Payouts"
            />
            <MetricCard
              label="Total Money Out"
              basis="before"
              value={formatMoney(totals.moneyOut)}
              valueClassName="text-loss"
              hint="Eval fees"
            />
            <MetricCard
              label="Net P&L"
              basis="before"
              value={formatMoney(totals.net)}
              valueClassName={signedTone(totals.net)}
              hint="In − Out"
            />
            <MetricCard
              label="Net P&L"
              basis="after"
              value={formatMoney(totals.netAfterTax)}
              valueClassName={signedTone(totals.netAfterTax)}
              hint={
                totals.tax > 0
                  ? `${formatMoney(totals.tax)} tax set aside`
                  : 'No tax on losses'
              }
            />
            <MetricCard
              label="ROI"
              basis="before"
              value={formatPercent(totals.roi)}
              valueClassName={totals.roi === null ? 'text-gain' : signedTone(totals.roi)}
              hint={totals.roi === null ? 'Needs eval fees' : `After tax ${formatPercent(totals.roiAfterTax)}`}
            />
          </section>

          <section className="mt-4 rounded-2xl border border-line bg-panel p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-fg">Monthly breakdown</h2>
              <p className="text-xs text-subtle">
                In · Out · Net before tax · Net after tax
              </p>
            </div>
            <MonthlyChart months={months} />
          </section>

          <section className="mt-4 rounded-2xl border border-line bg-panel p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-fg">All entries</h2>
              <p className="text-xs text-subtle">
                {entries.length} total · amounts before tax
              </p>
            </div>
            {entries.length === 0 ? (
              <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-subtle">
                No entries yet. Add your first payout or eval fee.
              </div>
            ) : (
              <EntriesTable
                entries={entries}
                onEdit={(entry) => setForm({ mode: 'edit', entry })}
                onDelete={setPendingDelete}
              />
            )}
          </section>
        </>
      )}

      <EntryFormModal
        open={form !== null}
        mode={form?.mode ?? 'add'}
        initial={formInitial}
        onClose={() => setForm(null)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this entry?"
        description="This can’t be undone."
        confirmLabel="Delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await deleteEntry(pendingDelete.id);
        }}
      >
        {pendingDelete && (
          <div className="rounded-xl border border-line bg-chip p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">
                {pendingDelete.type === 'payout' ? 'Payout' : 'Eval fee'} · {formatDate(pendingDelete.date)}
              </span>
              <span
                className={`font-money font-semibold ${pendingDelete.type === 'payout' ? 'text-gain' : 'text-loss'}`}
              >
                {formatSignedMoney(signedCents(pendingDelete))}
              </span>
            </div>
            {pendingDelete.notes && <p className="mt-2 break-words text-subtle">{pendingDelete.notes}</p>}
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
