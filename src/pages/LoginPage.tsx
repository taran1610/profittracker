import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link, useRouter, useSearch } from '@tanstack/react-router';
import { useAuth } from '../auth/AuthProvider';
import { GoogleIcon } from '../components/icons';
import { ThemeCycleButton } from '../components/ThemeToggle';
import { Spinner } from '../components/Panel';
import { errorMessage } from '../lib/format';
import { friendlyError } from '../lib/errors';
import { inputClass, primaryButtonClass } from '../lib/styles';

function safeTarget(value: string | undefined): string {
  if (!value) return '/trading';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) return '/trading';
  return value;
}

export function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();
  const { redirect } = useSearch({ from: '/login' });
  const target = safeTarget(redirect);
  const ids = { email: useId(), password: useId() };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.history.replace(target);
    }
  }, [loading, user, router, target]);

  if (loading || user) return <Spinner />;

  const onEmailSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy('email');
    try {
      await signInWithEmail(email, password);
      router.history.replace(target);
    } catch (err) {
      setError(friendlyError(err) || errorMessage(err));
      setBusy(null);
    }
  };

  return (
    <div className="relative grid min-h-dvh place-items-center px-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeCycleButton />
        <Link to="/" className="rounded-xl px-3 py-2 text-sm font-semibold text-muted bg-hover">
          Home
        </Link>
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-lg font-bold shadow-lg shadow-cyan-500/25">
            PT
          </Link>
          <h1 className="font-display mt-5 text-3xl font-bold tracking-tight text-fg">Welcome back</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Sign in to your tracker, journal, and reminders.
          </p>
        </div>

        <div
          className="rounded-2xl border border-line bg-panel p-6"
          style={{ boxShadow: '0 25px 50px var(--shadow)' }}
        >
          <form onSubmit={onEmailSignIn} className="space-y-3" noValidate>
            <input
              id={ids.email}
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} min-h-12`}
              required
            />
            <input
              id={ids.password}
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} min-h-12`}
              required
            />
            <button type="submit" disabled={busy !== null} className={`${primaryButtonClass} min-h-12 w-full`}>
              {busy === 'email' ? 'Signing in…' : 'Sign in with email'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-subtle">
            <span className="h-px flex-1 bg-[var(--line)]" />
            or
            <span className="h-px flex-1 bg-[var(--line)]" />
          </div>

          <button
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              setBusy('google');
              setError(null);
              try {
                await signInWithGoogle(target);
              } catch (err) {
                setError(friendlyError(err) || errorMessage(err));
                setBusy(null);
              }
            }}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 text-sm font-bold text-slate-900 ring-1 ring-black/5 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <GoogleIcon />
            {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
          </button>

          {error && <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <p className="mt-4 text-center text-sm text-subtle">
            New here?{' '}
            <Link to="/" className="font-semibold text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
