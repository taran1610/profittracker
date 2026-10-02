import { useId, useState, type FormEvent } from 'react';
import type { EntryInput, EntryType } from '../types';
import { centsToInput, errorMessage, ISO_DATE, parseAmountToCents } from '../../../lib/format';
import { Modal } from '../../../components/Modal';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../../../lib/styles';

interface EntryFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  initial: EntryInput;
  onClose: () => void;
  onSubmit: (input: EntryInput) => Promise<void>;
}

export function EntryFormModal({ open, mode, initial, onClose, onSubmit }: EntryFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Add entry' : 'Edit entry'}
      description="Amounts are entered before tax."
    >
      {/* Re-mount on each open so the fields reset to `initial`. */}
      {open && <EntryForm initial={initial} mode={mode} onCancel={onClose} onSubmit={onSubmit} />}
    </Modal>
  );
}

const TYPE_OPTIONS: { value: EntryType; title: string; subtitle: string; active: string }[] = [
  {
    value: 'payout',
    title: 'Payout',
    subtitle: 'Money in',
    active: 'border-emerald-400 bg-emerald-500/15 text-gain',
  },
  {
    value: 'fee',
    title: 'Eval fee',
    subtitle: 'Money out',
    active: 'border-rose-400 bg-rose-500/15 text-loss',
  },
];

function EntryForm({
  initial,
  mode,
  onCancel,
  onSubmit,
}: {
  initial: EntryInput;
  mode: 'add' | 'edit';
  onCancel: () => void;
  onSubmit: (input: EntryInput) => Promise<void>;
}) {
  const ids = { date: useId(), amount: useId(), notes: useId() };
  const [type, setType] = useState<EntryType>(initial.type);
  const [date, setDate] = useState(initial.date);
  const [amount, setAmount] = useState(initial.amountCents > 0 ? centsToInput(initial.amountCents) : '');
  const [notes, setNotes] = useState(initial.notes);
  const [errors, setErrors] = useState<{ date?: string; amount?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cents = parseAmountToCents(amount);
    const next: typeof errors = {};
    if (!ISO_DATE.test(date)) next.date = 'Pick a date.';
    if (cents === null) next.amount = 'Enter an amount greater than 0, e.g. 150 or 1,250.50.';
    setErrors(next);
    if (next.date || next.amount || cents === null) return;

    setSaving(true);
    setSaveError(null);
    try {
      await onSubmit({ type, date, amountCents: cents, notes: notes.trim() });
    } catch (err) {
      setSaveError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-muted">Type</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {TYPE_OPTIONS.map((opt) => {
            const selected = type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setType(opt.value)}
                className={`rounded-xl border px-3 py-2.5 text-left transition focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:outline-none ${
                  selected ? opt.active : 'border-line text-muted bg-hover'
                }`}
              >
                <span className="block text-sm font-semibold">{opt.title}</span>
                <span className="block text-xs opacity-75">{opt.subtitle}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor={ids.date} className="mb-1.5 block text-xs font-medium text-slate-400">
          Date
        </label>
        <input
          id={ids.date}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
          aria-invalid={!!errors.date}
        />
        {errors.date && <p className="mt-1 text-xs text-rose-300">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor={ids.amount} className="mb-1.5 block text-xs font-medium text-slate-400">
          Amount <span className="text-slate-500">(before tax)</span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
            $
          </span>
          <input
            id={ids.amount}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} pl-7 tabular-nums`}
            aria-invalid={!!errors.amount}
          />
        </div>
        {errors.amount ? (
          <p className="mt-1 text-xs text-rose-300">{errors.amount}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            Enter a positive number. The type above decides whether it counts as money in or out.
          </p>
        )}
      </div>

      <div>
        <label htmlFor={ids.notes} className="mb-1.5 block text-xs font-medium text-slate-400">
          Notes <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          id={ids.notes}
          rows={3}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Apex 50K payout #2, Topstep combine reset…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {saveError && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{saveError}</p>}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Saving…' : mode === 'add' ? 'Add entry' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
