import { useTheme, type ThemeMode } from '../theme/ThemeProvider';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

const OPTIONS: { value: ThemeMode; label: string; icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: MonitorIcon },
];

/** Compact cycle button for the top nav. */
export function ThemeCycleButton() {
  const { mode, resolved, setMode } = useTheme();

  const cycle = () => {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setMode(next);
  };

  const label =
    mode === 'system' ? `Theme: system (${resolved})` : `Theme: ${mode}`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center rounded-xl p-2 text-muted transition bg-hover"
    >
      {resolved === 'dark' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

/** Full chooser for the Settings page. */
export function ThemePicker() {
  const { mode, setMode } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setMode(value)}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
              selected ? 'border-sky-400 bg-sky-500/15 text-fg' : 'border-line text-muted bg-hover'
            }`}
          >
            <Icon width={18} height={18} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
