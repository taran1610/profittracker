import { useMemo, useState } from 'react';
import type { Entry } from '../types';
import { signedCents } from '../calc';
import { formatDate, formatSignedMoney } from '../../../lib/format';
import { PencilIcon, SortIcon, TrashIcon } from '../../../components/icons';

type SortKey = 'date' | 'type' | 'amount' | 'notes';
type SortDir = 'asc' | 'desc';
interface SortState {
  key: SortKey;
  dir: SortDir;
}

const MOBILE_SORT_OPTIONS: { value: `${SortKey}:${SortDir}`; label: string }[] = [
  { value: 'date:desc', label: 'Date · newest first' },
  { value: 'date:asc', label: 'Date · oldest first' },
  { value: 'amount:desc', label: 'Amount · high to low' },
  { value: 'amount:asc', label: 'Amount · low to high' },
  { value: 'type:asc', label: 'Type · eval fees first' },
  { value: 'type:desc', label: 'Type · payouts first' },
  { value: 'notes:asc', label: 'Notes · A to Z' },
];

function compare(a: Entry, b: Entry, key: SortKey): number {
  switch (key) {
    case 'date':
      return a.date.localeCompare(b.date);
    case 'type':
      return a.type.localeCompare(b.type);
    case 'amount':
      return signedCents(a) - signedCents(b);
    case 'notes':
      return a.notes.localeCompare(b.notes, undefined, { sensitivity: 'base' });
  }
}

interface EntriesTableProps {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

export function EntriesTable({ entries, onEdit, onDelete }: EntriesTableProps) {
  const [sort, setSort] = useState<SortState>({ key: 'date', dir: 'desc' });

  const sorted = useMemo(() => {
    const direction = sort.dir === 'asc' ? 1 : -1;
    return [...entries].sort(
      (a, b) => (compare(a, b, sort.key) || a.createdAt - b.createdAt) * direction,
    );
  }, [entries, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'date' || key === 'amount' ? 'desc' : 'asc' },
    );

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
        No entries yet. Add your first payout or eval fee to get started.
      </div>
    );
  }

  const header = (key: SortKey, label: string, widthClass: string, align: 'left' | 'right' = 'left') => {
    const active = sort.key === key;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={`px-4 py-3 font-medium ${widthClass} ${align === 'right' ? 'text-right' : 'text-left'}`}
      >
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className={`inline-flex items-center gap-1.5 rounded transition hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:outline-none ${
            active ? 'text-slate-200' : ''
          } ${align === 'right' ? 'flex-row-reverse' : ''}`}
        >
          {label}
          <SortIcon direction={active ? sort.dir : null} />
        </button>
      </th>
    );
  };

  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden overflow-hidden rounded-xl border border-white/[0.06] md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-white/[0.02] text-xs text-slate-400">
            <tr>
              {header('date', 'Date', 'w-36')}
              {header('type', 'Type', 'w-32')}
              {header('amount', 'Amount (before tax)', 'w-48', 'right')}
              {header('notes', 'Notes', '')}
              <th scope="col" className="w-24 px-4 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sorted.map((entry) => (
              <tr key={entry.id} className="transition hover:bg-white/[0.02]">
                <td className="px-4 py-3 whitespace-nowrap text-slate-300 tabular-nums">{formatDate(entry.date)}</td>
                <td className="px-4 py-3">
                  <TypePill entry={entry} />
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums ${
                    entry.type === 'payout' ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {formatSignedMoney(signedCents(entry))}
                </td>
                <td className="truncate px-4 py-3 text-slate-400" title={entry.notes || undefined}>
                  {entry.notes || <span className="text-slate-600">—</span>}
                </td>
                <td className="px-4 py-2 text-right">
                  <RowActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <label className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-400">
          Sort by
          <select
            value={`${sort.key}:${sort.dir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(':') as [SortKey, SortDir];
              setSort({ key, dir });
            }}
            className="rounded-lg border border-white/10 bg-[#070c17] px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-400/60 focus:outline-none"
          >
            {MOBILE_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <ul className="space-y-2">
          {sorted.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TypePill entry={entry} />
                    <span className="text-xs text-slate-500 tabular-nums">{formatDate(entry.date)}</span>
                  </div>
                  {entry.notes && <p className="mt-2 text-sm break-words text-slate-400">{entry.notes}</p>}
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold whitespace-nowrap tabular-nums ${
                      entry.type === 'payout' ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {formatSignedMoney(signedCents(entry))}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">Before tax</p>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <RowActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function TypePill({ entry }: { entry: Entry }) {
  return entry.type === 'payout' ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
      <span className="size-1.5 rounded-full bg-emerald-400" />
      Payout
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/10 px-2 py-0.5 text-xs font-medium text-rose-300">
      <span className="size-1.5 rounded-full bg-rose-400" />
      Eval fee
    </span>
  );
}

function RowActions({
  entry,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  const label = `${entry.type === 'payout' ? 'payout' : 'eval fee'} on ${formatDate(entry.date)}`;
  return (
    <div className="inline-flex gap-1">
      <button
        type="button"
        onClick={() => onEdit(entry)}
        aria-label={`Edit ${label}`}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:outline-none"
      >
        <PencilIcon />
      </button>
      <button
        type="button"
        onClick={() => onDelete(entry)}
        aria-label={`Delete ${label}`}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-rose-400/50 focus-visible:outline-none"
      >
        <TrashIcon />
      </button>
    </div>
  );
}
