import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import postgres from 'npm:postgres@3.4.5';

// Invoked hourly by pg_cron (see the schedule_reminders migration). Authenticated with a
// shared secret stored in Vault, so this function is deployed with verify_jwt = false.

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false });

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = Deno.env.get('REMINDER_FROM_EMAIL');
const APP_URL = (Deno.env.get('APP_URL') ?? '').replace(/\/+$/, '');

// Resend's default limit is 2 requests/second.
const SEND_INTERVAL_MS = 600;

interface DueReminder {
  id: string;
  email: string;
  display_name: string | null;
  reminder_frequency: 'daily' | 'weekdays' | 'weekly';
  local_date: string;
  month_pnl_cents: string;
  month_days: number;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const [secret] = await sql<{ decrypted_secret: string }[]>`
    select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret'
  `;
  if (!secret || !safeEqual(req.headers.get('x-cron-secret') ?? '', secret.decrypted_secret)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (!RESEND_API_KEY || !FROM || !APP_URL) {
    console.error('Missing RESEND_API_KEY, REMINDER_FROM_EMAIL or APP_URL secret');
    return json({ error: 'Reminder email is not configured' }, 500);
  }

  const due = await sql<DueReminder[]>`
    with candidates as (
      select
        p.id,
        p.display_name,
        p.reminder_frequency,
        p.reminder_hour,
        p.reminder_weekday,
        p.last_reminded_on,
        u.email,
        now() at time zone p.timezone as local_now
      from public.profiles p
      join auth.users u on u.id = p.id
      where p.reminder_frequency <> 'off'
        and u.email is not null
    )
    select
      c.id,
      c.email,
      c.display_name,
      c.reminder_frequency,
      c.local_now::date::text as local_date,
      coalesce(sum(j.pnl_cents), 0)::text as month_pnl_cents,
      count(j.id)::int as month_days
    from candidates c
    left join public.journal_entries j
      on j.user_id = c.id
      and j.entry_date >= date_trunc('month', c.local_now)::date
      and j.entry_date <= c.local_now::date
    where extract(hour from c.local_now) = c.reminder_hour
      and (c.last_reminded_on is null or c.last_reminded_on < c.local_now::date)
      and case c.reminder_frequency
        when 'daily' then true
        when 'weekdays' then extract(isodow from c.local_now) between 1 and 5
        when 'weekly' then extract(dow from c.local_now) = c.reminder_weekday
        else false
      end
      and not exists (
        select 1 from public.journal_entries t
        where t.user_id = c.id and t.entry_date = c.local_now::date
      )
    group by c.id, c.email, c.display_name, c.reminder_frequency, c.local_now
  `;

  let sent = 0;
  const failures: { userId: string; error: string }[] = [];

  for (const reminder of due) {
    try {
      await sendReminder(reminder);
      await sql`update public.profiles set last_reminded_on = ${reminder.local_date}::date where id = ${reminder.id}`;
      sent++;
    } catch (error) {
      failures.push({ userId: reminder.id, error: error instanceof Error ? error.message : String(error) });
    }
    await delay(SEND_INTERVAL_MS);
  }

  console.log('send-reminders finished', { due: due.length, sent, failed: failures.length });
  if (failures.length) console.error('send-reminders failures', failures);
  return json({ due: due.length, sent, failures });
});

async function sendReminder(r: DueReminder) {
  const name = r.display_name?.trim().split(/\s+/)[0];
  const monthPnl = Number(r.month_pnl_cents);
  const journalUrl = `${APP_URL}/journal?date=${r.local_date}`;
  const settingsUrl = `${APP_URL}/settings`;
  const period = r.reminder_frequency === 'weekly' ? 'this week' : 'today';

  const subject =
    r.reminder_frequency === 'weekly'
      ? 'Weekly journal: log your trading results'
      : "Journal reminder: did you finish green or red today?";

  const monthLine =
    r.month_days > 0
      ? `This month so far: ${formatSigned(monthPnl)} across ${r.month_days} journaled ${r.month_days === 1 ? 'day' : 'days'}.`
      : 'No journal entries yet this month. Today is a good day to start.';

  const text = [
    `Hi${name ? ` ${name}` : ''},`,
    '',
    `Take two minutes to journal ${period}: enter your profit or loss (use a negative number for a loss) and a few notes on what went well and what didn't.`,
    '',
    `Log it here: ${journalUrl}`,
    '',
    monthLine,
    '',
    `Change or turn off these reminders: ${settingsUrl}`,
  ].join('\n');

  const html = `
<div style="background:#05080f;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0">
  <div style="max-width:480px;margin:0 auto;background:#0b1220;border:1px solid #1e293b;border-radius:16px;padding:28px">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#38bdf8">ProfitTracker</p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#fff">Time to journal ${period}</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#cbd5e1">
      Hi${name ? ` ${escapeHtml(name)}` : ''}, did you make a profit or a loss? Log the number
      (negative for a loss) and a few notes on what went well and what didn't.
    </p>
    <a href="${journalUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:12px">Log my P&amp;L</a>
    <p style="margin:20px 0 0;font-size:13px;color:#94a3b8">${escapeHtml(monthLine)}</p>
  </div>
  <p style="max-width:480px;margin:16px auto 0;font-size:11px;color:#64748b;text-align:center">
    You're getting this because reminders are on in ProfitTracker.
    <a href="${settingsUrl}" style="color:#94a3b8">Change or turn off reminders</a>
  </p>
</div>`;

  const body = JSON.stringify({ from: FROM, to: [r.email], subject, html, text });

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body,
    });
    if (res.ok) return;
    if (res.status === 429 && attempt === 0) {
      await delay(1500);
      continue;
    }
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}

function formatSigned(cents: number): string {
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(cents) / 100);
  return cents > 0 ? `+${amount}` : cents < 0 ? `-${amount}` : amount;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
