# StageLog JP Supabase SQL

## Purpose

This directory stores Supabase schema migrations and read-only check scripts for StageLog JP.

- Migration files live directly under `supabase/sql/`.
- Read-only verification scripts live under `supabase/sql/checks/`.
- These files are intended for manual execution in the Supabase SQL Editor when setting up or updating a project database.

## Run order

Recommended migration order:

1. `01_profiles_and_user_settings.sql`
2. `02_events_core.sql`
3. `03_event_images_storage.sql`
4. `04_ticket_applications_core.sql`
5. `05_ticket_model_v2.sql`
6. `06_custom_venues.sql`
7. `07_events_doors_open_time.sql`

After running schema-changing SQL, run:

```sql
notify pgrst, 'reload schema';
```

Some migration files already include this statement. Running it again is safe.

## Migration files

### `01_profiles_and_user_settings.sql`

Creates `public.profiles` for user profile and app settings fields such as display name, username, language, theme, and avatar URL. Enables RLS and defines user-owned profile policies.

### `02_events_core.sql`

Creates or normalizes the `public.events` table used by event records. It ensures core event fields, image fields, `seat` / `weather` JSONB fields, timestamps, and events RLS policies are present.

This file is both the events core setup and the events schema compatibility patch. It remains idempotent through `create table if not exists`, `add column if not exists`, and `drop policy if exists`.

### `03_event_images_storage.sql`

Adds `events.image_path` if needed, creates/updates the `event-images` Supabase Storage bucket, and defines storage object policies so users can access only their own uploaded event images.

### `04_ticket_applications_core.sql`

Creates the base `public.ticket_applications` table and its RLS policies. This is the pre-V2 ticket application schema.

### `05_ticket_model_v2.sql`

Adds Ticket Management V2 fields to `public.ticket_applications`, including:

- `ticket_group_key`
- `round_name`
- `round_type`
- `applied_quantity`
- `won_quantity`
- `paid_quantity`
- `currency`
- `display_currency`
- `amount_original`
- `exchange_rate_to_display`
- `amount_display`
- `unit_price_original`

This project uses `ticketGroupKey` single-table grouping. It does not create a `ticket_groups` table.

### `06_custom_venues.sql`

Creates `public.custom_venues` for the Custom Venues B-lite user-owned venue library. It defines custom venue fields, RLS policies, an `updated_at` trigger, and schema reload notification.

Run this before using cloud-synced custom venue library features.

### `07_events_doors_open_time.sql`

Adds `public.events.doors_open_time` for event doors-open time.

Important: `doors_open_time` is `text`, not `time` or `timestamptz`. This matches the existing `events.start_time text` field and keeps frontend/localStorage/cloud data consistent.

The file also converts an existing mistakenly-created `doors_open_time` column back to `text`.

## Check scripts

Files under `supabase/sql/checks/` are read-only checks. They are not migrations and should not be treated as setup steps.

- `checks/check_events_columns.sql`: lists columns on `public.events`.
- `checks/check_ticket_applications_columns.sql`: lists columns on `public.ticket_applications`.
- `checks/check_custom_venues_columns.sql`: lists columns on `public.custom_venues`.
- `checks/check_rls_policies.sql`: lists relevant RLS policies on public and storage tables.

## Important notes

- Run `notify pgrst, 'reload schema';` after schema-changing SQL so PostgREST sees new columns.
- RLS must be enabled and policies must be present for user-owned data isolation.
- Custom venue cloud sync requires `06_custom_venues.sql`.
- `doors_open_time` must stay `text` to match `events.start_time text`.
- Do not manually change Supabase schema without updating the matching SQL file in this directory.
- Do not merge historical migrations into one large file. Keep setup and patch history explicit.

## Manual verification queries

View `events` columns:

```sql
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'events'
order by ordinal_position;
```

View `ticket_applications` columns:

```sql
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'ticket_applications'
order by ordinal_position;
```

View `custom_venues` columns:

```sql
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'custom_venues'
order by ordinal_position;
```

View RLS policies:

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in (
    'events',
    'profiles',
    'ticket_applications',
    'custom_venues',
    'objects'
  )
order by schemaname, tablename, policyname;
```
