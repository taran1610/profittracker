-- Stores every distinct signup email once, for future outreach.
-- Populated automatically when someone creates an auth account (e.g. Google sign-in).

create schema if not exists private;

create table public.signup_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users (id) on delete set null,
  source text not null default 'signup',
  created_at timestamptz not null default now(),
  constraint signup_emails_email_unique unique (email)
);

create index signup_emails_created_at_idx on public.signup_emails (created_at desc);

alter table public.signup_emails enable row level security;

-- No policies for anon/authenticated: only the dashboard / service role can read the full list.
revoke all on public.signup_emails from anon, authenticated;

create or replace function private.capture_signup_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or btrim(new.email) = '' then
    return new;
  end if;

  insert into public.signup_emails (email, user_id, source)
  values (lower(btrim(new.email)), new.id, 'signup')
  on conflict (email) do update
    set user_id = coalesce(excluded.user_id, public.signup_emails.user_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_capture on auth.users;
create trigger on_auth_user_email_capture
  after insert on auth.users
  for each row execute function private.capture_signup_email();

drop trigger if exists on_auth_user_email_update on auth.users;
create trigger on_auth_user_email_update
  after update of email on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function private.capture_signup_email();

-- Backfill anyone who already signed up before this migration.
insert into public.signup_emails (email, user_id, source)
select lower(btrim(u.email)), u.id, 'backfill'
from auth.users u
where u.email is not null and btrim(u.email) <> ''
on conflict (email) do nothing;
