-- StageLog JP Custom Venues B-lite foundation
-- Run this after the base cloud sync SQL files.

create extension if not exists pgcrypto;

create table if not exists public.custom_venues (
  id text primary key default ('custom:' || gen_random_uuid()::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  name_ja text,
  name_zh text,
  aliases text[] default '{}',
  city text not null default 'Unknown',
  country text not null default 'Japan',
  prefecture text,
  region text,
  latitude numeric,
  longitude numeric,
  category text,
  capacity integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.custom_venues enable row level security;

drop policy if exists "Users can view own custom venues" on public.custom_venues;
create policy "Users can view own custom venues"
on public.custom_venues
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own custom venues" on public.custom_venues;
create policy "Users can insert own custom venues"
on public.custom_venues
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own custom venues" on public.custom_venues;
create policy "Users can update own custom venues"
on public.custom_venues
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own custom venues" on public.custom_venues;
create policy "Users can delete own custom venues"
on public.custom_venues
for delete
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists custom_venues_set_updated_at on public.custom_venues;
create trigger custom_venues_set_updated_at
before update on public.custom_venues
for each row
execute function public.set_updated_at();

notify pgrst, 'reload schema';
