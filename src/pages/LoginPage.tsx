import { useEffect, useState } from 'react';
import { useRouter, useSearch } from '@tanstack/react-router';
import { useAuth } from '../auth/AuthProvider';
import { GoogleIcon } from '../components/icons';
import { Spinner } from '../components/Panel';
import { errorMessage } from '../lib/format';

function safeTarget(value: string | undefined): string {
  if (!value) return '/trading';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) return '/trading';
  return value;
}

export function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { redirect } = useSearch({ from: '/login' });
  const target = safeTarget(redirect);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.history.replace(target);
    }
  }, [loading, user, router, target]);

  if (loading || user) return <Spinner />;

  return (
    <div className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_top,rgba(30,58,138,0.25),transparent_60%)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-linear-to-br from-sky-400 to-indigo-500 text-base font-bold text-white shadow-lg shadow-sky-500/20">
            PT
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">ProfitTracker</h1>
          <p className="mt-2 text-sm text-slate-400">
            Track payouts and eval fees, journal your daily P&amp;L, and get reminders to stay consistent.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0b1220] p-6 shadow-2xl shadow-black/40">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await signInWithGoogle(target);
              } catch (err) {
                setError(errorMessage(err));
                setBusy(false);
              }
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60"
          >
            <GoogleIcon />
            {busy ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>
          {error && <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
          <p className="mt-4 text-center text-xs text-slate-500">
            Each account is private. Your friends can't see your numbers, and you can't see theirs.
          </p>
        </div>
      </div>
    </div>
  );
}
