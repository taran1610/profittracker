-- =============================================================================
-- ProfitTracker — paste this ENTIRE file into Supabase SQL Editor and click Run
-- Project: https://supabase.com/dashboard/project/adnqpjsdozyybnachvjh/sql/new
-- =============================================================================

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  reminder_frequency text not null default 'weekdays'
    check (reminder_frequency in ('off', 'daily', 'weekdays', 'weekly')),
  reminder_hour smallint not null default 18 check (reminder_hour between 0 and 23),
  reminder_weekday smallint not null default 0 check (reminder_weekday between 0 and 6),
  timezone text not null default 'UTC',
  last_reminded_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, reminder_frequency, reminder_hour, reminder_weekday, timezone)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Entries (payouts / eval fees)
-- ---------------------------------------------------------------------------
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('payout', 'fee')),
  entry_date date not null,
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 100000000000),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entries_user_id_entry_date_idx on public.entries (user_id, entry_date);

alter table public.entries enable row level security;

drop policy if exists "Users can view their own entries" on public.entries;
create policy "Users can view their own entries"
  on public.entries for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own entries" on public.entries;
create policy "Users can insert their own entries"
  on public.entries for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own entries" on public.entries;
create policy "Users can update their own entries"
  on public.entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own entries" on public.entries;
create policy "Users can delete their own entries"
  on public.entries for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.entries from anon;
grant select, insert, update, delete on public.entries to authenticated;

-- ---------------------------------------------------------------------------
-- Journal (daily profit / loss)
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  pnl_cents bigint not null check (abs(pnl_cents) <= 100000000000),
  notes text not null default '' check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.journal_entries enable row level security;

drop policy if exists "Users can view their own journal" on public.journal_entries;
create policy "Users can view their own journal"
  on public.journal_entries for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert into their own journal" on public.journal_entries;
create policy "Users can insert into their own journal"
  on public.journal_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own journal" on public.journal_entries;
create policy "Users can update their own journal"
  on public.journal_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete from their own journal" on public.journal_entries;
create policy "Users can delete from their own journal"
  on public.journal_entries for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.journal_entries from anon;
grant select, insert, update, delete on public.journal_entries to authenticated;

-- ---------------------------------------------------------------------------
-- Signup emails (one row per email, for future outreach)
-- ---------------------------------------------------------------------------
create table if not exists public.signup_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users (id) on delete set null,
  source text not null default 'signup',
  created_at timestamptz not null default now(),
  constraint signup_emails_email_unique unique (email)
);

create index if not exists signup_emails_created_at_idx on public.signup_emails (created_at desc);

alter table public.signup_emails enable row level security;
revoke all on public.signup_emails from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Triggers / functions
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

drop trigger if exists set_updated_at on public.entries;
create trigger set_updated_at before update on public.entries
  for each row execute function private.set_updated_at();

drop trigger if exists set_updated_at on public.journal_entries;
create trigger set_updated_at before update on public.journal_entries
  for each row execute function private.set_updated_at();

create or replace function private.validate_profile_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform now() at time zone new.timezone;
  return new;
end;
$$;

drop trigger if exists validate_timezone on public.profiles;
create trigger validate_timezone before insert or update of timezone on public.profiles
  for each row execute function private.validate_profile_timezone();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

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

-- ---------------------------------------------------------------------------
-- Backfill people who already signed up
-- ---------------------------------------------------------------------------
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')
from auth.users u
on conflict (id) do nothing;

insert into public.signup_emails (email, user_id, source)
select lower(btrim(u.email)), u.id, 'backfill'
from auth.users u
where u.email is not null and btrim(u.email) <> ''
on conflict (email) do nothing;
