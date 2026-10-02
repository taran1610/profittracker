import { Link, Outlet, createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { TradingTrackerPage } from './features/trading-tracker/TradingTrackerPage';
import { JournalPage } from './features/journal/JournalPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ISO_DATE } from './lib/format';

/** Only allow same-origin relative paths so the login redirect can't be abused. */
function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) return undefined;
  return value;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-sm text-slate-400">Page not found.</p>
        <Link to="/trading" className="mt-3 inline-block text-sm text-sky-300 hover:underline">
          Go to the tracker
        </Link>
      </div>
    </div>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: safeRedirect(search.redirect),
  }),
  component: LoginPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/trading' });
  },
});

const trackerRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/trading',
  component: TradingTrackerPage,
});

const journalRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/journal',
  validateSearch: (search: Record<string, unknown>): { date?: string } => ({
    date: typeof search.date === 'string' && ISO_DATE.test(search.date) ? search.date : undefined,
  }),
  component: JournalPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/settings',
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([indexRoute, trackerRoute, journalRoute, settingsRoute]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
