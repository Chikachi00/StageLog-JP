-- =========================================================
-- StageLog JP - Add doors open time to events
-- File: supabase/sql/07_events_doors_open_time.sql
-- Purpose:
--   Add "doors open" time for event records.
--   Keep it as text to match existing events.start_time.
-- =========================================================

alter table public.events
add column if not exists doors_open_time text;

alter table public.events
alter column doors_open_time type text
using case
  when doors_open_time is null then null
  else doors_open_time::text
end;

notify pgrst, 'reload schema';
