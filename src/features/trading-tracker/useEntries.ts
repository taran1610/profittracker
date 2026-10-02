import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Entry, EntryInput } from './types';

const COLUMNS = 'id, type, entry_date, amount_cents, notes, created_at, updated_at';

interface EntryRow {
  id: string;
  type: Entry['type'];
  entry_date: string;
  amount_cents: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

function fromRow(row: EntryRow): Entry {
  return {
    id: row.id,
    type: row.type,
    date: row.entry_date,
    amountCents: Number(row.amount_cents),
    notes: row.notes,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
  };
}

function toRow(input: EntryInput) {
  return {
    type: input.type,
    entry_date: input.date,
    amount_cents: input.amountCents,
    notes: input.notes,
  };
}

export type LoadStatus = 'loading' | 'ready' | 'error';

export function useEntries(userId: string) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    supabase
      .from('entries')
      .select(COLUMNS)
      .order('entry_date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
          setStatus('error');
          return;
        }
        setEntries((data as unknown as EntryRow[]).map(fromRow));
        setLoadError(null);
        setStatus('ready');
      });
    return () => {
      cancelled = true;
    };
  }, [userId, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  const addEntry = useCallback(async (input: EntryInput) => {
    const { data, error } = await supabase.from('entries').insert(toRow(input)).select(COLUMNS).single();
    if (error) throw error;
    setEntries((prev) => [...prev, fromRow(data as unknown as EntryRow)]);
  }, []);

  const updateEntry = useCallback(async (id: string, input: EntryInput) => {
    const { data, error } = await supabase
      .from('entries')
      .update(toRow(input))
      .eq('id', id)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    const updated = fromRow(data as unknown as EntryRow);
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) throw error;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, status, loadError, reload, addEntry, updateEntry, deleteEntry };
}
