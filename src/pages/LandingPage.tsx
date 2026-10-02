import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../auth/AuthProvider';
import { GoogleIcon } from '../components/icons';
import { ThemeCycleButton } from '../components/ThemeToggle';
import { Spinner } from '../components/Panel';
import { errorMessage, formatMoney, formatPercent } from '../lib/format';
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

  if (loading || user) return <Spinner label="Loading ProfitTracker…" />;

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

  const scrollToSignUp = () => {
    const el = document.getElementById('signup-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-full max-w-6xl -translate-x-1/2 opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 25%, transparent), transparent 70%)',
        }}
        aria-hidden
      />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-nav/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-display text-base font-bold text-fg transition hover:opacity-90">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-xs font-black shadow-md shadow-cyan-500/20">
              PT
            </span>
            <span className="tracking-tight">ProfitTracker</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#preview" className="text-sm font-medium text-muted transition hover:text-fg">
              Product Preview
            </a>
            <a href="#features" className="text-sm font-medium text-muted transition hover:text-fg">
              Features
            </a>
            <a href="#calculator" className="text-sm font-medium text-muted transition hover:text-fg">
              Tax Math
            </a>
            <a href="#faq" className="text-sm font-medium text-muted transition hover:text-fg">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeCycleButton />
            <Link
              to="/login"
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted transition hover:text-fg bg-hover"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={scrollToSignUp}
              className="hidden rounded-xl bg-accent px-4 py-2 text-sm font-bold shadow-md shadow-cyan-500/15 transition hover:brightness-110 sm:inline-flex"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="signup-section" className="relative px-4 pt-12 pb-16 sm:px-8 sm:pt-20 sm:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-600 [html[data-theme=dark]_&]:text-cyan-300">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Built for Prop Firm &amp; Retail Futures Traders
          </div>

          <h1 className="font-display mt-6 text-4xl font-extrabold tracking-tight text-fg sm:text-5xl lg:text-6xl">
            Know if prop trading is <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              actually making you money.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Stop guessing whether evaluation resets are eating your payouts. Log your combines and payouts, journal daily
            P&amp;L, and get automatic <strong>11.7% tax reserves</strong> so you keep what you make.
          </p>

          {/* Hero Sign Up Card */}
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-panel/90 p-5 shadow-2xl backdrop-blur-sm sm:p-7">
            <form onSubmit={onEmailSignUp} className="space-y-3.5 text-left" noValidate>
              <div>
                <label htmlFor={ids.email} className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Email
                </label>
                <input
                  id={ids.email}
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} mt-1.5 min-h-11`}
                />
              </div>

              <div>
                <label htmlFor={ids.password} className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Password
                </label>
                <input
                  id={ids.password}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} mt-1.5 min-h-11`}
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={busy !== null}
                  className={`${primaryButtonClass} w-full min-h-11 text-base`}
                >
                  {busy === 'email' ? 'Creating your account…' : 'Sign up with email'}
                </button>
              </div>

              <div className="relative my-3 flex items-center justify-center">
                <span className="h-px w-full bg-line" />
                <span className="absolute bg-panel px-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                  or
                </span>
              </div>

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
                className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 text-sm font-bold text-slate-900 ring-1 ring-black/10 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <GoogleIcon />
                <span>{busy === 'google' ? 'Redirecting to Google…' : 'Continue with Google'}</span>
              </button>
            </form>

            {error && (
              <p className="mt-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-500">
                {error}
              </p>
            )}
            {confirmMsg && (
              <p className="mt-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-medium text-gain">
                {confirmMsg}
              </p>
            )}

            <p className="mt-4 text-center text-xs text-subtle">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent hover:underline">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CheckBadgeIcon /> 100% Private (No bank logins)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckBadgeIcon /> 11.7% Automated Tax Reserve
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckBadgeIcon /> Apex, Topstep &amp; All Firms
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckBadgeIcon /> Habit &amp; Journal Reminders
            </span>
          </div>
        </div>
      </section>

      {/* High-Fidelity Product Preview Showcase */}
      <section id="preview" className="relative border-t border-line px-4 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
              Interactive Product Preview
            </p>
            <h2 className="font-display mt-2 text-3xl font-extrabold text-fg sm:text-4xl">
              Clean. Focused. Zero clutter.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Explore how your prop business looks inside ProfitTracker. Switch between the <strong>Trading Tracker</strong> ledger
              and your <strong>Daily Trading Journal</strong> below.
            </p>
          </div>

          <div className="mt-10">
            <InteractiveProductPreview />
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section id="features" className="border-t border-line px-4 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
              Everything in one place
            </p>
            <h2 className="font-display mt-2 text-3xl font-extrabold text-fg sm:text-4xl">
              Engineered specifically for prop traders
            </h2>
            <p className="mt-3 text-base text-muted">
              Most trading tools focus on chart indicators. ProfitTracker focuses on the actual business of trading: cash flow,
              eval costs, taxes, and consistency.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<LedgerIcon />}
              title="Airtight Ledger: In vs Out"
              description="Log payouts and evaluation fees in seconds. Categorize by firm (Apex, Topstep, TradeDay, FundedNext) and see exact net profit."
            />
            <FeatureCard
              icon={<PercentIcon />}
              title="11.7% Tax Set-Aside Rule"
              description="Prop firm payouts are 1099 miscellaneous income. We automatically set aside 11.7% on positive net profits only — zero tax applied on losses."
            />
            <FeatureCard
              icon={<BookOpenIcon />}
              title="Daily P&L & Trade Journal"
              description="Record your daily trading session in under 30 seconds. Track green vs red days, win rate percentages, and psychological notes."
            />
            <FeatureCard
              icon={<BellIcon />}
              title="Smart Consistency Reminders"
              description="Set weekday or weekly email reminders so you never forget to log. Automatically skipped on days you've already completed."
            />
            <FeatureCard
              icon={<ShieldIcon />}
              title="100% Private & Isolated"
              description="Row-Level Security guarantees your data is visible only to you. We never ask for broker passwords, API keys, or bank links."
            />
            <FeatureCard
              icon={<PaletteIcon />}
              title="Light, Dark &amp; System Modes"
              description="Deep midnight navy for nighttime market reviews, or clean crisp slate for daytime sunlight. Adapts instantly to your setup."
            />
          </div>
        </div>
      </section>

      {/* Interactive Tax & ROI Calculator */}
      <section id="calculator" className="border-t border-line px-4 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
                Interactive Tax Model
              </p>
              <h2 className="font-display mt-2 text-3xl font-extrabold text-fg sm:text-4xl">
                See your true net after eval fees &amp; taxes
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                An 11.7% tax reserve is applied solely to positive net profit (Money In minus Money Out). If your evaluations
                exceed your payouts, your tax liability is calculated as $0.00.
              </p>
              <div className="mt-6 flex items-center gap-3 text-xs text-subtle">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span>Formula: Max(0, Money In − Money Out) × 11.7%</span>
              </div>
            </div>

            <div className="lg:col-span-7">
              <InteractiveCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* Before vs After */}
      <section className="border-t border-line px-4 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
              The Reality of Prop Trading
            </p>
            <h2 className="font-display mt-2 text-3xl font-extrabold text-fg sm:text-4xl">
              Trading blind vs. Trading with ProfitTracker
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-500">
                <span className="grid size-6 place-items-center rounded-full bg-rose-500/10 text-xs">✕</span>
                Without ProfitTracker
              </div>
              <ul className="mt-6 space-y-4 text-sm text-muted">
                <li className="flex items-start gap-3">
                  <span className="text-rose-500">•</span>
                  <span>Buying challenge resets without knowing your cumulative spend.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500">•</span>
                  <span>Celebrating a $3,000 payout while having spent $3,500 on evals and activations.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500">•</span>
                  <span>Panic at tax season with no reserve set aside for 1099 profit.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500">•</span>
                  <span>Forgetting to journal trading errors and repeating emotional tilt.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sm font-bold text-gain">
                <span className="grid size-6 place-items-center rounded-full bg-emerald-500/10 text-xs">✓</span>
                With ProfitTracker
              </div>
              <ul className="mt-6 space-y-4 text-sm text-muted">
                <li className="flex items-start gap-3">
                  <span className="text-gain">•</span>
                  <span>Instant visibility into exact Net P&amp;L and ROI across every prop firm.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gain">•</span>
                  <span>Automatic 11.7% tax calculation on true profit so you know your take-home.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gain">•</span>
                  <span>Daily journaling streak with win rate percentages and lessons learned.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gain">•</span>
                  <span>Automated email reminders keep you accountable after market close.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t border-line px-4 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
              Frequently Asked Questions
            </p>
            <h2 className="font-display mt-2 text-3xl font-extrabold text-fg sm:text-4xl">
              Got questions? We have answers.
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            <FaqItem
              question="Why should I use this instead of my prop firm dashboard?"
              answer="Prop firm dashboards only show your balance for their specific firm. They don't track the $1,200 you spent on evaluations across three other firms, reset fees, or your after-tax take home. ProfitTracker unifies your entire prop portfolio."
            />
            <FaqItem
              question="How is the 11.7% tax calculated?"
              answer="We calculate Money In minus Money Out. If the result is positive, exactly 11.7% is reserved for estimated taxes. If the net is negative or zero, tax liability is $0.00. You see both your Before Tax and After Tax numbers side by side."
            />
            <FaqItem
              question="Do you require my brokerage or bank login?"
              answer="No, never. ProfitTracker is intentionally manual and private. We never ask for broker credentials, API keys, or bank connections. You stay in 100% control of what you log."
            />
            <FaqItem
              question="Which prop firms can I track?"
              answer="Any firm! You can tag notes with Apex Trader Funding, Topstep, TradeDay, FundedNext, MyFundedFutures, Bulenox, or your personal cash account."
            />
            <FaqItem
              question="Can other people see my trading numbers?"
              answer="No. Your account is secured by Supabase Row-Level Security (RLS). Other users, even friends you invite, only see their own accounts."
            />
          </div>
        </div>
      </section>

      {/* Final Bottom CTA */}
      <section className="border-t border-line px-4 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-line bg-gradient-to-b from-panel to-panel/50 p-8 text-center shadow-2xl sm:p-14">
          <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
            Start Today · Free for individual traders
          </p>
          <h2 className="font-display mt-3 text-3xl font-extrabold text-fg sm:text-5xl">
            Treat your trading like a business.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
            Create an account in 10 seconds. Know your true numbers before your next evaluation reset.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={scrollToSignUp}
              className={`${primaryButtonClass} min-h-12 px-8 text-base`}
            >
              Sign up with email
            </button>
            <Link
              to="/login"
              className="flex min-h-12 items-center justify-center rounded-xl border border-line px-6 text-sm font-semibold text-fg transition bg-hover"
            >
              Sign in to existing account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5 font-display text-sm font-bold text-fg">
            <span className="grid size-7 place-items-center rounded-lg bg-accent text-[11px] font-black">PT</span>
            ProfitTracker
          </div>
          <p className="text-xs text-subtle">
            © {new Date().getFullYear()} ProfitTracker. Built for prop firm traders.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted">
            <a href="#features" className="hover:text-fg">Features</a>
            <a href="#preview" className="hover:text-fg">Preview</a>
            <a href="#faq" className="hover:text-fg">FAQ</a>
            <Link to="/login" className="hover:text-fg">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Interactive Product Preview showcasing both the Trading Tracker ledger and the Daily Journal
 * with realistic dummy data matching the actual app features.
 */
function InteractiveProductPreview() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'journal'>('tracker');
  const [selectedMonth, setSelectedMonth] = useState<number>(4); // default to October (index 4)

  const monthsData = [
    { label: 'Jun', inCents: 240000, outCents: 62000, netCents: 178000, netTaxCents: 157174 },
    { label: 'Jul', inCents: 380000, outCents: 49000, netCents: 331000, netTaxCents: 292273 },
    { label: 'Aug', inCents: 195000, outCents: 85000, netCents: 110000, netTaxCents: 97130 },
    { label: 'Sep', inCents: 420000, outCents: 33000, netCents: 387000, netTaxCents: 341721 },
    { label: 'Oct', inCents: 450000, outCents: 28000, netCents: 422000, netTaxCents: 372626 },
  ];

  const activeMonth = monthsData[selectedMonth] ?? monthsData[4];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
      {/* App Window Chrome Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-line bg-nav/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-rose-500/80" />
          <span className="size-3 rounded-full bg-amber-500/80" />
          <span className="size-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 hidden rounded-md border border-line bg-chip px-2.5 py-0.5 font-mono text-[11px] text-muted sm:inline-block">
            app.profittracker.com/{activeTab === 'tracker' ? 'trading' : 'journal'}
          </span>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-1 rounded-xl border border-line bg-chip p-1">
          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'tracker'
                ? 'bg-accent text-slate-900 shadow-sm'
                : 'text-muted hover:text-fg'
            }`}
          >
            📈 Trading Tracker
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'journal'
                ? 'bg-accent text-slate-900 shadow-sm'
                : 'text-muted hover:text-fg'
            }`}
          >
            📓 Daily Journal
          </button>
        </div>

        <div className="hidden items-center gap-2 text-xs font-medium text-emerald-500 sm:flex">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Interactive Demo Data</span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {activeTab === 'tracker' ? (
          <div>
            {/* Title Bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-accent uppercase">Finance · Trading</p>
                <h3 className="font-display text-2xl font-bold text-fg sm:text-3xl">Trading Tracker</h3>
                <p className="mt-1 text-xs text-muted">Payouts in, eval fees out. Tax set-aside of 11.7% on positive net only.</p>
              </div>
              <span className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-slate-900 opacity-90 shadow">
                + Add entry
              </span>
            </div>

            {/* 5 KPI Metric Cards */}
            <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
              <MockMetricCard label="Total Money In" basis="before" value="$16,850.00" valueTone="text-gain" hint="Payouts received" />
              <MockMetricCard label="Total Money Out" basis="before" value="$3,420.00" valueTone="text-loss" hint="Eval fees & resets" />
              <MockMetricCard label="Net P&L" basis="before" value="+$13,430.00" valueTone="text-gain" hint="In − Out" />
              <MockMetricCard label="Net P&L" basis="after" value="+$11,858.69" valueTone="text-gain" hint="$1,571.31 tax set aside" />
              <MockMetricCard label="ROI" basis="before" value="+392.7%" valueTone="text-gain" hint="After tax +346.7%" />
            </div>

            {/* Monthly Bar Chart Breakdown */}
            <div className="mt-6 rounded-2xl border border-line bg-panel p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-display text-sm font-semibold text-fg">Monthly Breakdown</h4>
                  <p className="text-xs text-subtle">Click any month to inspect exact income vs eval expenses</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-gain"><span className="size-2 rounded-sm bg-emerald-400" /> Money In</span>
                  <span className="inline-flex items-center gap-1.5 text-loss"><span className="size-2 rounded-sm bg-rose-400" /> Money Out</span>
                  <span className="inline-flex items-center gap-1.5 text-accent"><span className="size-2 rounded-sm bg-cyan-400" /> Net</span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="mt-6 flex h-40 items-end gap-3 sm:gap-6 border-b border-line pb-2">
                {monthsData.map((m, idx) => {
                  const isSelected = selectedMonth === idx;
                  const inPct = (m.inCents / 500000) * 100;
                  const outPct = (m.outCents / 500000) * 100;
                  const netPct = (m.netCents / 500000) * 100;

                  return (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setSelectedMonth(idx)}
                      className={`group flex flex-1 flex-col items-center justify-end rounded-xl p-2 transition focus:outline-none ${
                        isSelected ? 'bg-white/5 ring-1 ring-cyan-400/40' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex w-full items-end justify-center gap-1 h-28">
                        <div
                          className="w-full max-w-4 rounded-t bg-emerald-400 transition-all group-hover:brightness-110"
                          style={{ height: `${inPct}%` }}
                          title={`In: ${formatMoney(m.inCents)}`}
                        />
                        <div
                          className="w-full max-w-4 rounded-t bg-rose-400 transition-all group-hover:brightness-110"
                          style={{ height: `${outPct}%` }}
                          title={`Out: ${formatMoney(m.outCents)}`}
                        />
                        <div
                          className="w-full max-w-4 rounded-t bg-cyan-400 transition-all group-hover:brightness-110"
                          style={{ height: `${netPct}%` }}
                          title={`Net: ${formatMoney(m.netCents)}`}
                        />
                      </div>
                      <span className={`mt-2 font-display text-xs font-semibold ${isSelected ? 'text-accent' : 'text-muted'}`}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Month Detail Strip */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-chip p-3 text-xs">
                <span className="font-semibold text-fg">
                  Selected Month: <span className="text-accent">{activeMonth.label} 2026</span>
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  <span>In: <strong className="text-gain">{formatMoney(activeMonth.inCents)}</strong></span>
                  <span>Out: <strong className="text-loss">{formatMoney(activeMonth.outCents)}</strong></span>
                  <span>Net: <strong className="text-gain">{formatMoney(activeMonth.netCents)}</strong></span>
                  <span>After Tax (11.7%): <strong className="text-accent">{formatMoney(activeMonth.netTaxCents)}</strong></span>
                </div>
              </div>
            </div>

            {/* Entries Table Preview */}
            <div className="mt-6 rounded-2xl border border-line bg-panel p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-semibold text-fg">Recent Ledger Entries</h4>
                <span className="text-xs text-subtle">6 of 18 entries</span>
              </div>
              <div className="mt-3 divide-y divide-line overflow-x-auto text-xs">
                {[
                  { date: 'Oct 01, 2026', type: 'payout', amount: '+$3,250.00', firm: 'Apex Trader Funding', note: 'PA 50k #3 - 1st payout' },
                  { date: 'Sep 28, 2026', type: 'eval', amount: '-$165.00', firm: 'Topstep Combine', note: '50k Trading Combine fee' },
                  { date: 'Sep 20, 2026', type: 'payout', amount: '+$4,800.00', firm: 'Topstep Funded', note: 'Funded account payout via ACH' },
                  { date: 'Sep 14, 2026', type: 'eval', amount: '-$150.00', firm: 'TradeDay', note: '50k Evaluation reset' },
                  { date: 'Sep 05, 2026', type: 'payout', amount: '+$5,100.00', firm: 'Apex Trader Funding', note: 'PA 150k #1 - 2nd payout' },
                  { date: 'Aug 29, 2026', type: 'eval', amount: '-$180.00', firm: 'FundedNext', note: '100k Stellar 2-step evaluation' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 gap-4">
                    <span className="w-24 text-subtle font-mono">{row.date}</span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        row.type === 'payout'
                          ? 'bg-emerald-500/15 text-gain'
                          : 'bg-rose-500/15 text-loss'
                      }`}
                    >
                      {row.type}
                    </span>
                    <span className="flex-1 truncate font-medium text-fg">
                      {row.firm} <span className="text-subtle font-normal">({row.note})</span>
                    </span>
                    <span className={`font-mono font-semibold ${row.type === 'payout' ? 'text-gain' : 'text-loss'}`}>
                      {row.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Daily Journal Tab */
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-accent uppercase">Consistency &amp; Psychology</p>
                <h3 className="font-display text-2xl font-bold text-fg sm:text-3xl">Trading Journal</h3>
                <p className="mt-1 text-xs text-muted">Log your daily P&amp;L in 30 seconds. Build an unbreakable trading habit.</p>
              </div>
              <span className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-xl border border-line bg-chip px-3.5 py-2 text-xs font-semibold text-fg">
                🔥 14-Day Streak
              </span>
            </div>

            {/* Journal Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-line bg-chip p-3.5">
                <p className="text-xs text-muted">Month P&amp;L</p>
                <p className="font-money mt-1 text-xl font-bold text-gain">+$6,420.00</p>
                <p className="mt-1 text-[11px] text-subtle">October 2026</p>
              </div>
              <div className="rounded-xl border border-line bg-chip p-3.5">
                <p className="text-xs text-muted">Days Traded</p>
                <p className="font-money mt-1 text-xl font-bold text-fg">18 Days</p>
                <p className="mt-1 text-[11px] text-subtle">14 Green · 4 Red</p>
              </div>
              <div className="rounded-xl border border-line bg-chip p-3.5">
                <p className="text-xs text-muted">Win Rate</p>
                <p className="font-money mt-1 text-xl font-bold text-gain">77.8%</p>
                <p className="mt-1 text-[11px] text-subtle">Profitable sessions</p>
              </div>
              <div className="rounded-xl border border-line bg-chip p-3.5">
                <p className="text-xs text-muted">Current Streak</p>
                <p className="font-money mt-1 text-xl font-bold text-amber-500">14 Days</p>
                <p className="mt-1 text-[11px] text-subtle">Consecutive logs</p>
              </div>
            </div>

            {/* Simulated Journal Calendar Heat Grid */}
            <div className="mt-6 rounded-2xl border border-line bg-panel p-4 sm:p-5">
              <h4 className="font-display text-sm font-semibold text-fg">October 2026 Session Heatmap</h4>
              <p className="text-xs text-subtle">Every day logged with daily net result</p>

              <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold text-subtle">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1.5 text-center">
                {/* 28 simulated day blocks */}
                {[
                  { d: 1, pnl: '+$840', tone: 'gain' },
                  { d: 2, pnl: '+$420', tone: 'gain' },
                  { d: 3, pnl: '-$210', tone: 'loss' },
                  { d: 4, pnl: '+$1,150', tone: 'gain' },
                  { d: 5, pnl: '+$600', tone: 'gain' },
                  { d: 6, pnl: 'Weekend', tone: 'flat' },
                  { d: 7, pnl: 'Weekend', tone: 'flat' },
                  { d: 8, pnl: '+$950', tone: 'gain' },
                  { d: 9, pnl: '-$350', tone: 'loss' },
                  { d: 10, pnl: '+$720', tone: 'gain' },
                  { d: 11, pnl: '+$1,300', tone: 'gain' },
                  { d: 12, pnl: '+$450', tone: 'gain' },
                  { d: 13, pnl: 'Weekend', tone: 'flat' },
                  { d: 14, pnl: 'Weekend', tone: 'flat' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center rounded-lg border p-1.5 transition ${
                      item.tone === 'gain'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-gain'
                        : item.tone === 'loss'
                        ? 'border-rose-500/30 bg-rose-500/10 text-loss'
                        : 'border-line bg-chip text-subtle'
                    }`}
                  >
                    <span className="text-[10px] opacity-75">{item.d}</span>
                    <span className="font-mono text-[11px] font-bold">{item.pnl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Trade Review Card */}
            <div className="mt-6 rounded-2xl border border-line bg-panel p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <span className="font-mono text-xs text-subtle">Session Review · Oct 01, 2026</span>
                  <p className="font-display text-base font-bold text-fg">NQ &amp; ES Morning Open Strategy</p>
                </div>
                <span className="font-mono text-lg font-bold text-gain">+$840.00</span>
              </div>
              <div className="mt-3 space-y-2 text-xs text-muted leading-relaxed">
                <p>
                  <strong>Execution Notes:</strong> Waited for the 10:00 AM ISM manufacturing news volatility to settle. NQ bounced
                  cleanly off the 15-minute VWAP with high buyer volume. Entered 2 micro contracts at 19,840 with a 15-point stop.
                </p>
                <p>
                  <strong>Psychology:</strong> Zero FOMO. Refused to chase the initial 9:30 AM fakeout. Held through the chop to first target.
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-line">
                <span className="rounded-md border border-line bg-chip px-2 py-0.5 text-[10px] text-muted">NQ Futures</span>
                <span className="rounded-md border border-line bg-chip px-2 py-0.5 text-[10px] text-muted">VWAP Bounce</span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-gain">Discipline: 10/10</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Mock Metric Card for the preview */
function MockMetricCard({
  label,
  basis,
  value,
  valueTone,
  hint,
}: {
  label: string;
  basis: 'before' | 'after';
  value: string;
  valueTone: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs text-muted truncate">{label}</span>
        {basis === 'before' ? (
          <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-600 [html[data-theme=dark]_&]:text-cyan-300">
            Before tax
          </span>
        ) : (
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 [html[data-theme=dark]_&]:text-amber-300">
            After tax
          </span>
        )}
      </div>
      <p className={`font-mono mt-2 text-lg sm:text-xl font-bold ${valueTone}`}>{value}</p>
      <p className="mt-1 text-[11px] text-subtle truncate">{hint}</p>
    </div>
  );
}

/** Interactive Tax Calculator component */
function InteractiveCalculator() {
  const [payouts, setPayouts] = useState<number>(8500);
  const [fees, setFees] = useState<number>(1450);

  const net = payouts - fees;
  const tax = net > 0 ? Math.round(net * 0.117) : 0;
  const netAfterTax = net > 0 ? net - tax : net;
  const roi = fees > 0 ? net / fees : 0;
  const roiAfterTax = fees > 0 ? netAfterTax / fees : 0;

  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-xl sm:p-8">
      <h3 className="font-display text-lg font-bold text-fg">Live Tax &amp; ROI Simulator</h3>
      <p className="text-xs text-muted">Test your own estimated numbers to see how ProfitTracker models your net.</p>

      <div className="mt-6 space-y-4">
        <div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted">Total Payouts Received (Money In)</span>
            <span className="font-mono text-gain">${payouts.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={0}
            max={30000}
            step={250}
            value={payouts}
            onChange={(e) => setPayouts(Number(e.target.value))}
            className="mt-2 w-full accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted">Total Evaluation &amp; Reset Fees (Money Out)</span>
            <span className="font-mono text-loss">${fees.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10000}
            step={50}
            value={fees}
            onChange={(e) => setFees(Number(e.target.value))}
            className="mt-2 w-full accent-cyan-400"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-chip p-3">
          <p className="text-[11px] text-muted">Net Before Tax</p>
          <p className={`font-mono mt-1 text-base font-bold ${net >= 0 ? 'text-gain' : 'text-loss'}`}>
            ${net.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[10px] text-subtle">ROI {formatPercent(roi)}</p>
        </div>
        <div className="rounded-xl border border-line bg-chip p-3">
          <p className="text-[11px] text-muted">11.7% Tax Reserve</p>
          <p className="font-mono mt-1 text-base font-bold text-amber-500">
            ${tax.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[10px] text-subtle">On profit only</p>
        </div>
        <div className="rounded-xl border border-line bg-chip p-3">
          <p className="text-[11px] text-muted">Take-Home Profit</p>
          <p className={`font-mono mt-1 text-base font-bold ${netAfterTax >= 0 ? 'text-gain' : 'text-loss'}`}>
            ${netAfterTax.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[10px] text-subtle">After tax reserve</p>
        </div>
        <div className="rounded-xl border border-line bg-chip p-3">
          <p className="text-[11px] text-muted">After-Tax ROI</p>
          <p className={`font-mono mt-1 text-base font-bold ${roiAfterTax >= 0 ? 'text-gain' : 'text-loss'}`}>
            {formatPercent(roiAfterTax)}
          </p>
          <p className="mt-0.5 text-[10px] text-subtle">On eval spend</p>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-subtle">
        Tax is only set aside if net profit is above $0. Evaluation spend is fully deducted before applying the 11.7% reserve.
      </p>
    </div>
  );
}

/** Feature Card Component */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-line bg-panel p-6 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-lg">
      <div className="grid size-10 place-items-center rounded-xl border border-line bg-chip text-accent transition group-hover:scale-105 group-hover:bg-cyan-500/10">
        {icon}
      </div>
      <h3 className="font-display mt-4 text-base font-bold text-fg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

/** FAQ Accordion Item */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-line bg-panel transition">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-fg sm:text-base"
      >
        <span>{question}</span>
        <span className={`ml-4 text-lg font-mono text-accent transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm leading-relaxed text-muted border-t border-line/60 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

/* Custom Minimal SVG Icons */
function CheckBadgeIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-gain">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function LedgerIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function PercentIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 5 5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l9.75 9.75" />
    </svg>
  );
}
