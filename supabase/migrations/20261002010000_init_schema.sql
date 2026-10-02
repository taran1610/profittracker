-- Private schema for trigger functions so they aren't exposed through the Data API.
create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Profiles: one row per user, holds reminder preferences.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  reminder_frequency text not null default 'weekdays'
    check (reminder_frequency in ('off', 'daily', 'weekdays', 'weekly')),
  reminder_hour smallint not null default 18 check (reminder_hour between 0 and 23),
  -- 0 = Sunday … 6 = Saturday (matches extract(dow ...)); only used when frequency = 'weekly'.
  reminder_weekday smallint not null default 0 check (reminder_weekday between 0 and 6),
  timezone text not null default 'UTC',
  last_reminded_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Users may only change their preferences, not bookkeeping columns like last_reminded_on.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, reminder_frequency, reminder_hour, reminder_weekday, timezone)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Entries: payouts (money in) and eval fees (money out).
-- ---------------------------------------------------------------------------
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('payout', 'fee')),
  entry_date date not null,
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 100000000000),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entries_user_id_entry_date_idx on public.entries (user_id, entry_date);

alter table public.entries enable row level security;

create policy "Users can view their own entries"
  on public.entries for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own entries"
  on public.entries for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own entries"
  on public.entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own entries"
  on public.entries for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.entries from anon;

-- ---------------------------------------------------------------------------
-- Journal: one trading-day result (profit or loss) per user per day.
-- ---------------------------------------------------------------------------
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  -- Positive = profit, negative = loss, zero = break-even.
  pnl_cents bigint not null check (abs(pnl_cents) <= 100000000000),
  notes text not null default '' check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.journal_entries enable row level security;

create policy "Users can view their own journal"
  on public.journal_entries for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert into their own journal"
  on public.journal_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own journal"
  on public.journal_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete from their own journal"
  on public.journal_entries for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.journal_entries from anon;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.entries
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.journal_entries
  for each row execute function private.set_updated_at();

-- Rejects unknown time zone names (Postgres raises on an invalid zone).
create function private.validate_profile_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform now() at time zone new.timezone;
  return new;
end;
$$;

create trigger validate_timezone before insert or update of timezone on public.profiles
  for each row execute function private.validate_profile_timezone();

create function private.handle_new_user()
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
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();
