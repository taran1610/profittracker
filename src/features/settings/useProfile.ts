import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export type ReminderFrequency = 'off' | 'daily' | 'weekdays' | 'weekly';

export interface Profile {
  displayName: string;
  reminderFrequency: ReminderFrequency;
  /** 0–23, in the user's own time zone. */
  reminderHour: number;
  /** 0 = Sunday … 6 = Saturday. */
  reminderWeekday: number;
  timezone: string;
}

const COLUMNS = 'display_name, reminder_frequency, reminder_hour, reminder_weekday, timezone';

interface ProfileRow {
  display_name: string | null;
  reminder_frequency: ReminderFrequency;
  reminder_hour: number;
  reminder_weekday: number;
  timezone: string;
}

function fromRow(row: ProfileRow): Profile {
  return {
    displayName: row.display_name ?? '',
    reminderFrequency: row.reminder_frequency,
    reminderHour: row.reminder_hour,
    reminderWeekday: row.reminder_weekday,
    timezone: row.timezone,
  };
}

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    supabase
      .from('profiles')
      .select(COLUMNS)
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
          setStatus('error');
          return;
        }
        setProfile(fromRow(data as unknown as ProfileRow));
        setStatus('ready');
      });
    return () => {
      cancelled = true;
    };
  }, [userId, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  const save = useCallback(
    async (next: Profile) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: next.displayName.trim() || null,
          reminder_frequency: next.reminderFrequency,
          reminder_hour: next.reminderHour,
          reminder_weekday: next.reminderWeekday,
          timezone: next.timezone,
        })
        .eq('id', userId)
        .select(COLUMNS)
        .single();
      if (error) throw error;
      setProfile(fromRow(data as unknown as ProfileRow));
    },
    [userId],
  );

  return { profile, status, loadError, reload, save };
}

export function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
