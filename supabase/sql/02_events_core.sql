-- StageLog JP events schema compatibility patch
-- Run this after the initial events table setup if any cloud event field is missing.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text not null,
  date date not null,
  start_time text,
  venue_id text not null,
  venue_name text not null,
  city text,
  country text,
  ticket_type text,
  seat jsonb default '{}'::jsonb,
  weather jsonb default '{}'::jsonb,
  notes text,
  image_url text,
  image_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists title text,
  add column if not exists artist text,
  add column if not exists date date,
  add column if not exists start_time text,
  add column if not exists venue_id text,
  add column if not exists venue_name text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists ticket_type text,
  add column if not exists seat jsonb default '{}'::jsonb,
  add column if not exists weather jsonb default '{}'::jsonb,
  add column if not exists notes text,
  add column if not exists image_url text,
  add column if not exists image_path text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.events set seat = '{}'::jsonb where seat is null;
update public.events set weather = '{}'::jsonb where weather is null;

alter table public.events
  alter column user_id set not null,
  alter column title set not null,
  alter column artist set not null,
  alter column date set not null,
  alter column venue_id set not null,
  alter column venue_name set not null,
  alter column seat set default '{}'::jsonb,
  alter column weather set default '{}'::jsonb;

alter table public.events enable row level security;

drop policy if exists "events_select_own" on public.events;
create policy "events_select_own"
on public.events
for select
using (auth.uid() = user_id);

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own"
on public.events
for insert
with check (auth.uid() = user_id);

drop policy if exists "events_update_own" on public.events;
create policy "events_update_own"
on public.events
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own"
on public.events
for delete
using (auth.uid() = user_id);
