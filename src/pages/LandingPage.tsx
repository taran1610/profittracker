import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../auth/AuthProvider';
import { GoogleIcon } from '../components/icons';
import { ThemeCycleButton } from '../components/ThemeToggle';
import { Spinner } from '../components/Panel';
import { errorMessage } from '../lib/format';
import { friendlyError } from '../lib/errors';
import { inputClass, primaryButtonClass } from '../lib/styles';

export function LandingPage() {
  const { user, loading, signInWithGoogle, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const ids = { email: useId(), password: useId() };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: '/trading', replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || user) return <Spinner label="Loading…" />;

  const onEmailSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setConfirmMsg(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy('email');
    try {
      const { needsConfirmation } = await signUpWithEmail(email, password);
      if (needsConfirmation) {
        setConfirmMsg('Check your email for a confirmation link, then you can sign in.');
        setBusy(null);
      } else {
        void navigate({ to: '/trading' });
      }
    } catch (err) {
      setError(friendlyError(err) || errorMessage(err));
      setBusy(null);
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-2.5 font-display text-sm font-bold text-fg">
          <span className="grid size-8 place-items-center rounded-xl bg-accent text-xs font-bold">PT</span>
          ProfitTracker
        </div>
        <div className="flex items-center gap-2">
          <ThemeCycleButton />
          <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-muted transition bg-hover">
            Sign in
          </Link>
        </div>
      </header>

      {/* Full-bleed hero plane */}
      <section className="relative min-h-[calc(100dvh-4rem)] overflow-hidden">
        <DashboardBackdrop />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-start px-4 pt-10 pb-20 sm:px-8 sm:pt-16 lg:pt-20">
          <div className="animate-fade-up">
            <p className="font-display text-5xl font-bold tracking-tight text-fg sm:text-6xl lg:text-7xl">
              ProfitTracker
            </p>
            <h1 className="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              Know if prop trading is actually making you money.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Log payouts and eval fees, journal each day&apos;s P&amp;L, and get email reminders so you stay honest
              with the numbers — before and after tax.
            </p>

            <form onSubmit={onEmailSignUp} className="mt-8 w-full max-w-md space-y-3" noValidate>
              <label htmlFor={ids.email} className="sr-only">
                Email
              </label>
              <input
                id={ids.email}
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} min-h-12 bg-panel/90 backdrop-blur`}
              />
              <label htmlFor={ids.password} className="sr-only">
                Password
              </label>
              <input
                id={ids.password}
                type="password"
                autoComplete="new-password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} min-h-12 bg-panel/90 backdrop-blur`}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={busy !== null}
                  className={`${primaryButtonClass} min-h-12 flex-1 text-base`}
                >
                  {busy === 'email' ? 'Creating account…' : 'Sign up with email'}
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={async () => {
                    setBusy('google');
                    setError(null);
                    try {
                      await signInWithGoogle('/trading');
                    } catch (err) {
                      setError(friendlyError(err) || errorMessage(err));
                      setBusy(null);
                    }
                  }}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-900 ring-1 ring-black/5 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <GoogleIcon />
                  {busy === 'google' ? '…' : 'Google'}
                </button>
              </div>
            </form>

            {error && (
              <p className="mt-3 max-w-md rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-600 backdrop-blur">
                {error}
              </p>
            )}
            {confirmMsg && (
              <p className="mt-3 max-w-md rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-gain backdrop-blur">
                {confirmMsg}
              </p>
            )}

            <p className="mt-4 text-sm text-subtle">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-bold text-fg sm:text-3xl">Built for prop firm traders</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Stop guessing whether evals and payouts are worth it. ProfitTracker keeps the money trail clear.
          </p>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              {
                title: 'Track money in and out',
                body: 'Log every payout and eval fee by hand. See totals, net P&L before and after an 11.7% tax set-aside, and ROI.',
              },
              {
                title: 'Journal every trading day',
                body: 'Record profit or loss in under a minute. Build a streak, spot your win rate, and keep notes on what worked.',
              },
              {
                title: 'Get reminded to stay consistent',
                body: 'Choose daily, weekdays, or weekly email reminders. Skipped automatically on days you’ve already journaled.',
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-display text-lg font-semibold text-fg">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-bold text-fg sm:text-3xl">Private by design</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Your entries stay on your account. Friends can use ProfitTracker too — they only see their own numbers.
            No bank connections. Everything is entered manually, so you stay in control.
          </p>
        </div>
      </section>

      <footer className="border-t border-line px-4 py-8 text-center text-xs text-subtle sm:px-8">
        © {new Date().getFullYear()} ProfitTracker
      </footer>
    </div>
  );
}

/** Edge-to-edge product atmosphere behind the hero copy. */
function DashboardBackdrop() {
  return (
    <div className="animate-fade-up-delay pointer-events-none absolute inset-0" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 75% 40%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 55%), linear-gradient(to bottom, transparent 40%, var(--bg) 95%)',
        }}
      />
      <div className="absolute top-[18%] right-[-8%] left-[28%] bottom-[-10%] opacity-[0.55] sm:left-[40%] sm:opacity-70">
        <div className="h-full rounded-tl-3xl border border-line bg-panel/80 shadow-2xl backdrop-blur-sm">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">Finance · Trading</p>
            <p className="mt-1 font-display text-lg font-bold text-fg">Trading Tracker</p>
          </div>
          <div className="grid grid-cols-3 gap-3 p-4">
            {[
              { label: 'Money In', value: '$4,250', tone: 'text-gain' },
              { label: 'Money Out', value: '$1,890', tone: 'text-loss' },
              { label: 'After tax', value: '$2,084', tone: 'text-gain' },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-line bg-chip p-3">
                <p className="text-[10px] text-subtle uppercase">{card.label}</p>
                <p className={`font-money mt-2 text-base font-semibold sm:text-lg ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-6">
            <div className="flex h-36 items-end gap-2 rounded-xl border border-line bg-chip px-4 pb-4 pt-6">
              {[42, 68, 50, 82, 58, 92, 74, 60].map((h, i) => (
                <div key={i} className="flex flex-1 items-end gap-0.5" style={{ height: '100%' }}>
                  <div className="w-full rounded-sm bg-emerald-400/75" style={{ height: `${h * 0.4}%` }} />
                  <div className="w-full rounded-sm bg-rose-400/65" style={{ height: `${(100 - h) * 0.22}%` }} />
                  <div className="w-full rounded-sm bg-cyan-400/80" style={{ height: `${h * 0.28}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
