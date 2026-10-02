create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Shared secret the send-reminders function checks; generated here so it never lives in git.
select vault.create_secret(
  replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  'reminder_cron_secret',
  'Authenticates pg_cron calls to the send-reminders Edge Function'
)
where not exists (select 1 from vault.secrets where name = 'reminder_cron_secret');

select vault.create_secret(
  'https://pliohalfyxwuepohdmdi.supabase.co',
  'project_url',
  'Base URL for invoking Edge Functions from pg_cron'
)
where not exists (select 1 from vault.secrets where name = 'project_url');

-- Runs at the top of every hour; the function decides who is due based on each user's
-- time zone, hour and frequency.
select cron.schedule(
  'send-journal-reminders',
  '0 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
