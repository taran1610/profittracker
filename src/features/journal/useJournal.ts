import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface JournalEntry {
  id: string;
  /** `YYYY-MM-DD` */
  date: string;
  /** Positive = profit, negative = loss. */
  pnlCents: number;
  notes: string;
  updatedAt: number;
}

const COLUMNS = 'id, entry_date, pnl_cents, notes, updated_at';

interface JournalRow {
  id: string;
  entry_date: string;
  pnl_cents: number;
  notes: string;
  updated_at: string;
}

function fromRow(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    date: row.entry_date,
    pnlCents: Number(row.pnl_cents),
    notes: row.notes,
    updatedAt: Date.parse(row.updated_at),
  };
}

function byDateDesc(a: JournalEntry, b: JournalEntry) {
  return b.date.localeCompare(a.date);
}

export function useJournal(userId: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    supabase
      .from('journal_entries')
      .select(COLUMNS)
      .order('entry_date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
          setStatus('error');
          return;
        }
        setEntries((data as unknown as JournalRow[]).map(fromRow));
        setLoadError(null);
        setStatus('ready');
      });
    return () => {
      cancelled = true;
    };
  }, [userId, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  /** Creates or replaces the entry for `date` (one entry per day). */
  const saveDay = useCallback(
    async (date: string, pnlCents: number, notes: string) => {
      const { data, error } = await supabase
        .from('journal_entries')
        .upsert(
          { user_id: userId, entry_date: date, pnl_cents: pnlCents, notes },
          { onConflict: 'user_id,entry_date' },
        )
        .select(COLUMNS)
        .single();
      if (error) throw error;
      const saved = fromRow(data as unknown as JournalRow);
      setEntries((prev) => [...prev.filter((e) => e.date !== saved.date), saved].sort(byDateDesc));
    },
    [userId],
  );

  const deleteDay = useCallback(async (id: string) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (error) throw error;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, status, loadError, reload, saveDay, deleteDay };
}
