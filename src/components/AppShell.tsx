import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { detectTimeZone } from '../features/settings/useProfile';
import { BookIcon, ChartIcon, LogOutIcon, SettingsIcon } from './icons';
import { Spinner } from './Panel';

const NAV: { to: '/trading' | '/journal' | '/settings'; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { to: '/trading', label: 'Tracker', icon: ChartIcon },
  { to: '/journal', label: 'Journal', icon: BookIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function AppShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const redirectedRef = useRef(false);

  // Navigate in an effect — never during render — to avoid an infinite update loop.
  // Use href (string). location.search is a parsed object and must not be stringified.
  useEffect(() => {
    if (loading || user || redirectedRef.current) return;
    redirectedRef.current = true;
    const redirect = location.href.startsWith('/login') ? '/trading' : location.href;
    void navigate({
      to: '/login',
      search: { redirect },
      replace: true,
    });
  }, [loading, user, navigate, location.href]);

  // New profiles start in UTC; adopt the browser's zone so reminders arrive at the right local hour.
  useEffect(() => {
    if (!user) return;
    const tz = detectTimeZone();
    if (tz === 'UTC') return;
    void supabase.from('profiles').update({ timezone: tz }).eq('id', user.id).eq('timezone', 'UTC');
  }, [user?.id]);

  if (loading || !user) return <Spinner />;

  const avatar = typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null;
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Account';

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,rgba(30,58,138,0.18),transparent_60%)]">
      <nav className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#05080f]/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link to="/trading" className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="grid size-7 place-items-center rounded-lg bg-linear-to-br from-sky-400 to-indigo-500 text-xs font-bold text-white">
              PT
            </span>
            ProfitTracker
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                activeProps={{
                  className: 'rounded-lg bg-white/[0.06] px-3 py-1.5 text-sm text-white transition',
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt="" referrerPolicy="no-referrer" className="size-7 rounded-full" />
            ) : null}
            <span className="hidden max-w-40 truncate text-xs text-slate-400 sm:block">{name}</span>
            <button
              type="button"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                try {
                  await signOut();
                } finally {
                  setSigningOut(false);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <LogOutIcon /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 sm:pt-10 md:pb-12">
        <Outlet />
      </main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-[#070b14]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-slate-500"
              activeProps={{ className: 'flex flex-col items-center gap-1 py-2.5 text-[11px] text-sky-300' }}
            >
              <Icon width={20} height={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
