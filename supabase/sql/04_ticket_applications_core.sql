-- StageLog JP ticket applications core table
-- Ticket Management V2 fields are added by 05_ticket_model_v2.sql.

create extension if not exists pgcrypto;

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
