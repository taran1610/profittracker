import { useMemo, useState } from 'react';
import type { Entry, EntryInput, EntryType } from './types';
import { TAX_RATE_LABEL, computeTotals, monthlyBreakdown, signedCents } from './calc';
import { formatDate, formatMoney, formatPercent, formatSignedMoney, todayIso } from '../../lib/format';
import { useEntries } from './useEntries';
import { useRequiredUser } from '../../auth/AuthProvider';
import { KpiCard } from '../../components/KpiCard';
import { LoadError, Panel, Spinner } from '../../components/Panel';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PlusIcon } from '../../components/icons';
import { MonthlyChart } from './components/MonthlyChart';
import { EntriesTable } from './components/EntriesTable';
import { EntryFormModal } from './components/EntryFormModal';

type FormState = { mode: 'add'; type: EntryType } | { mode: 'edit'; entry: Entry } | null;

function signedTone(value: number): string {
  if (value > 0) return 'text-emerald-300';
  if (value < 0) return 'text-rose-300';
  return 'text-white';
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Trading Tracker</h1>
          <p className="mt-1 text-sm text-slate-400">
            Payouts and eval fees, entered manually. Only you can see your entries.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            disabled={status !== 'ready'}
            onClick={() => setForm({ mode: 'add', type: 'payout' })}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            <PlusIcon /> Payout
          </button>
          <button
            type="button"
            disabled={status !== 'ready'}
            onClick={() => setForm({ mode: 'add', type: 'fee' })}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
          >
            <PlusIcon /> Eval fee
          </button>
        </div>
      </header>

      {status === 'loading' && <Spinner label="Loading your entries…" />}
      {status === 'error' && (
        <div className="mt-8">
          <LoadError message={loadError ?? 'Unknown error'} onRetry={reload} />
        </div>
      )}

      {status === 'ready' && (
        <>
          <section aria-label="Key metrics" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KpiCard
              label="Total Money In"
              basis="before"
              value={formatMoney(totals.moneyIn)}
              valueClassName="text-emerald-300"
              accentClassName="via-emerald-400/70"
              hint="All payouts"
            />
            <KpiCard
              label="Total Money Out"
              basis="before"
              value={formatMoney(totals.moneyOut)}
              valueClassName="text-rose-300"
              accentClassName="via-rose-400/70"
              hint="All eval fees"
            />
            <KpiCard
              label="Net P&L"
              basis="before"
              value={formatMoney(totals.net)}
              valueClassName={signedTone(totals.net)}
              accentClassName="via-sky-400/70"
              hint="Money in − money out"
            />
            <KpiCard
              label="Net P&L"
              basis="after"
              value={formatMoney(totals.netAfterTax)}
              valueClassName={signedTone(totals.netAfterTax)}
              accentClassName="via-violet-400/70"
              hint={
                totals.tax > 0
                  ? `${formatMoney(totals.tax)} set aside (${TAX_RATE_LABEL})`
                  : 'No tax set aside while net ≤ $0'
              }
            />
            <KpiCard
              label="ROI"
              basis="before"
              value={formatPercent(totals.roi)}
              valueClassName={totals.roi === null ? 'text-slate-500' : signedTone(totals.roi)}
              accentClassName="via-amber-400/70"
              className="col-span-2 lg:col-span-1"
              hint={
                totals.roi === null
                  ? 'Add an eval fee to calculate ROI'
                  : `After tax: ${formatPercent(totals.roiAfterTax)} · net ÷ money out`
              }
            />
          </section>

          <Panel
            title="Monthly breakdown"
            subtitle="Money In, Money Out, Net (before tax) and Net (after tax) per month"
          >
            <MonthlyChart months={months} />
          </Panel>

          <Panel
            title="All entries"
            subtitle={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} · amounts shown before tax`}
          >
            <EntriesTable
              entries={entries}
              onEdit={(entry) => setForm({ mode: 'edit', entry })}
              onDelete={setPendingDelete}
            />
          </Panel>
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
        title="Delete entry?"
        description="This can't be undone."
        confirmLabel="Delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await deleteEntry(pendingDelete.id);
        }}
      >
        {pendingDelete && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300">
                {pendingDelete.type === 'payout' ? 'Payout' : 'Eval fee'} · {formatDate(pendingDelete.date)}
              </span>
              <span
                className={`font-semibold tabular-nums ${pendingDelete.type === 'payout' ? 'text-emerald-300' : 'text-rose-300'}`}
              >
                {formatSignedMoney(signedCents(pendingDelete))}
              </span>
            </div>
            {pendingDelete.notes && <p className="mt-2 break-words text-slate-500">{pendingDelete.notes}</p>}
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
