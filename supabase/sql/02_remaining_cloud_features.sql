-- StageLog JP remaining cloud features
-- Run this file in the Supabase SQL Editor after the initial events table/RLS setup.

create extension if not exists pgcrypto;

alter table public.events
add column if not exists image_path text;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  username text,
  home_region text,
  language text default 'en',
  theme text default 'sakura',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = id);

create table if not exists public.ticket_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_title text not null,
  artist text not null,
  venue_id text,
  venue_name text,
  city text,
  country text,
  event_date date,
  platform text not null,
  application_date date,
  result_date date,
  payment_deadline date,
  issue_date date,
  status text not null,
  ticket_type text,
  price numeric,
  quantity integer,
  companion_name text,
  companion_contact text,
  memo text,
  linked_event_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ticket_applications enable row level security;

drop policy if exists "ticket_applications_select_own" on public.ticket_applications;
create policy "ticket_applications_select_own"
on public.ticket_applications
for select
using (auth.uid() = user_id);

drop policy if exists "ticket_applications_insert_own" on public.ticket_applications;
create policy "ticket_applications_insert_own"
on public.ticket_applications
for insert
with check (auth.uid() = user_id);

drop policy if exists "ticket_applications_update_own" on public.ticket_applications;
create policy "ticket_applications_update_own"
on public.ticket_applications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ticket_applications_delete_own" on public.ticket_applications;
create policy "ticket_applications_delete_own"
on public.ticket_applications
for delete
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "event_images_select_own" on storage.objects;
create policy "event_images_select_own"
on storage.objects
for select
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "event_images_insert_own" on storage.objects;
create policy "event_images_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "event_images_update_own" on storage.objects;
create policy "event_images_update_own"
on storage.objects
for update
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "event_images_delete_own" on storage.objects;
create policy "event_images_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
