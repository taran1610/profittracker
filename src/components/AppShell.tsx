import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { detectTimeZone } from '../features/settings/useProfile';
import { BookIcon, ChartIcon, LogOutIcon, SettingsIcon } from './icons';
import { ThemeCycleButton } from './ThemeToggle';
import { Spinner } from './Panel';

const NAV: {
  to: '/trading' | '/journal' | '/settings';
  label: string;
  short: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { to: '/trading', label: 'Money', short: 'Money', icon: ChartIcon },
  { to: '/journal', label: 'Journal', short: 'Journal', icon: BookIcon },
  { to: '/settings', label: 'Settings', short: 'Settings', icon: SettingsIcon },
];

export function AppShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const redirectedRef = useRef(false);

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

  useEffect(() => {
    if (!user) return;
    const tz = detectTimeZone();
    if (tz === 'UTC') return;
    void supabase.from('profiles').update({ timezone: tz }).eq('id', user.id).eq('timezone', 'UTC');
  }, [user?.id]);

  if (loading || !user) return <Spinner label="Signing you in…" />;

  const avatar = typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null;
  const name = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? user.email ?? 'Account';

  return (
    <div className="min-h-dvh">
      <nav className="sticky top-0 z-30 border-b border-line bg-nav backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link to="/trading" className="flex items-center gap-2.5 font-display text-sm font-bold text-fg">
            <span className="grid size-8 place-items-center rounded-xl bg-accent text-xs font-bold">
              PT
            </span>
            <span className="hidden sm:inline">ProfitTracker</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted transition bg-hover"
                activeProps={{
                  className:
                    'rounded-xl bg-sky-500/15 px-3.5 py-2 text-sm font-semibold text-sky-700 [html[data-theme=dark]_&]:text-sky-300',
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeCycleButton />
            {avatar ? (
              <img src={avatar} alt="" referrerPolicy="no-referrer" className="size-8 rounded-full ring-1 ring-[var(--line)]" />
            ) : (
              <span className="grid size-8 place-items-center rounded-full bg-chip text-xs font-semibold text-fg">
                {name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="hidden max-w-28 truncate text-sm text-muted sm:block">{name}</span>
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
              className="inline-flex items-center justify-center rounded-xl p-2 text-muted transition bg-hover"
              aria-label="Sign out"
            >
              <LogOutIcon />
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 sm:px-6 sm:pt-8 md:pb-12">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-nav pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-3">
          {NAV.map(({ to, short, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-subtle"
              activeProps={{
                className:
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-sky-700 [html[data-theme=dark]_&]:text-sky-300',
              }}
            >
              <Icon width={20} height={20} />
              {short}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
