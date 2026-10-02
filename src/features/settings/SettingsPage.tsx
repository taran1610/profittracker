import { useId, useMemo, useState, type FormEvent } from 'react';
import { useRequiredUser } from '../../auth/AuthProvider';
import { LoadError, Panel, Spinner } from '../../components/Panel';
import { errorMessage, formatHour } from '../../lib/format';
import { inputClass, primaryButtonClass } from '../../lib/styles';
import { detectTimeZone, useProfile, type Profile, type ReminderFrequency } from './useProfile';

const FREQUENCIES: { value: ReminderFrequency; label: string; description: string }[] = [
  { value: 'weekdays', label: 'Weekdays', description: 'Monday to Friday' },
  { value: 'daily', label: 'Every day', description: 'Including weekends' },
  { value: 'weekly', label: 'Weekly', description: 'One day a week' },
  { value: 'off', label: 'Off', description: 'No reminder emails' },
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function timeZoneOptions(current: string): string[] {
  let zones: string[] = [];
  try {
    zones = Intl.supportedValuesOf('timeZone');
  } catch {
    zones = [];
  }
  const set = new Set([...zones, current, detectTimeZone(), 'UTC']);
  return [...set].sort();
}

function describeSchedule(p: Profile): string {
  const time = `${formatHour(p.reminderHour)} (${p.timezone.replace(/_/g, ' ')})`;
  switch (p.reminderFrequency) {
    case 'off':
      return 'Reminder emails are off.';
    case 'daily':
      return `You'll get a reminder every day at ${time}.`;
    case 'weekdays':
      return `You'll get a reminder Monday to Friday at ${time}.`;
    case 'weekly':
      return `You'll get a reminder every ${WEEKDAYS[p.reminderWeekday]} at ${time}.`;
  }
}

export function SettingsPage() {
  const user = useRequiredUser();
  const { profile, status, loadError, reload, save } = useProfile(user.id);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Signed in as {user.email}</p>
      </header>

      {status === 'loading' && <Spinner label="Loading settings…" />}
      {status === 'error' && (
        <div className="mt-8">
          <LoadError message={loadError ?? 'Unknown error'} onRetry={reload} />
        </div>
      )}
      {status === 'ready' && profile && <SettingsForm initial={profile} email={user.email ?? ''} onSave={save} />}
    </>
  );
}

function SettingsForm({
  initial,
  email,
  onSave,
}: {
  initial: Profile;
  email: string;
  onSave: (p: Profile) => Promise<void>;
}) {
  const ids = { name: useId(), hour: useId(), weekday: useId(), tz: useId() };
  const [draft, setDraft] = useState<Profile>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const zones = useMemo(() => timeZoneOptions(initial.timezone), [initial.timezone]);
  const detected = detectTimeZone();

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onSave(draft);
      setMessage({ kind: 'ok', text: 'Settings saved.' });
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const remindersOn = draft.reminderFrequency !== 'off';

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Panel title="Profile" className="mt-8">
        <label htmlFor={ids.name} className="mb-1.5 block text-xs font-medium text-slate-400">
          Display name
        </label>
        <input
          id={ids.name}
          type="text"
          maxLength={80}
          value={draft.displayName}
          onChange={(e) => update('displayName', e.target.value)}
          placeholder="What should reminder emails call you?"
          className={`${inputClass} max-w-sm`}
        />
      </Panel>

      <Panel
        title="Journal reminder emails"
        subtitle={`Sent to ${email}. Skipped automatically on days you've already journaled.`}
      >
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-slate-400">How often</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
            {FREQUENCIES.map((f) => {
              const selected = draft.reminderFrequency === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update('reminderFrequency', f.value)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    selected
                      ? 'border-sky-400/60 bg-sky-400/10 text-sky-100'
                      : 'border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <span className="block text-sm font-semibold">{f.label}</span>
                  <span className="block text-xs opacity-70">{f.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {draft.reminderFrequency === 'weekly' && (
            <div>
              <label htmlFor={ids.weekday} className="mb-1.5 block text-xs font-medium text-slate-400">
                Day
              </label>
              <select
                id={ids.weekday}
                value={draft.reminderWeekday}
                onChange={(e) => update('reminderWeekday', Number(e.target.value))}
                className={inputClass}
              >
                {WEEKDAYS.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor={ids.hour} className="mb-1.5 block text-xs font-medium text-slate-400">
              Time
            </label>
            <select
              id={ids.hour}
              value={draft.reminderHour}
              disabled={!remindersOn}
              onChange={(e) => update('reminderHour', Number(e.target.value))}
              className={inputClass}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </div>
          <div className={draft.reminderFrequency === 'weekly' ? '' : 'sm:col-span-2'}>
            <label htmlFor={ids.tz} className="mb-1.5 block text-xs font-medium text-slate-400">
              Time zone
            </label>
            <select
              id={ids.tz}
              value={draft.timezone}
              disabled={!remindersOn}
              onChange={(e) => update('timezone', e.target.value)}
              className={inputClass}
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {detected !== draft.timezone && remindersOn && (
              <button
                type="button"
                onClick={() => update('timezone', detected)}
                className="mt-1.5 text-xs text-sky-300 hover:underline"
              >
                Use this device's time zone ({detected.replace(/_/g, ' ')})
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-300">
          {describeSchedule(draft)}
        </p>
      </Panel>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {message && (
          <span className={`text-sm ${message.kind === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
