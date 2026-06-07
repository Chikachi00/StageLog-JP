# StageLog JP Supabase Setup

StageLog JP can run fully in localStorage guest mode. Supabase is optional for logged-in cloud sync.

## Authentication

The app supports both:

- Magic Link / Email OTP sign-in
- Email + Password sign-in and sign-up

If frequent Magic Link testing triggers Supabase email rate limits, use Email + Password during development.

In Supabase Dashboard, configure Authentication -> URL Configuration:

- Site URL: your deployed app URL
- Redirect URLs: your deployed app URL and any local development URL you intentionally use

The app does not hardcode a local redirect URL; Auth redirects use the current `window.location.origin`.

## Environment Variables

Configure these variables in `.env.local` for local development and in Vercel project settings for production:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Do not use a `service_role` key in frontend code, Vercel public env vars, or committed files.

## SQL Migration

Run this SQL file in the Supabase SQL Editor:

```text
supabase/sql/02_remaining_cloud_features.sql
```

If your existing `events` table was created before the latest cloud sync fixes, also run:

```text
supabase/sql/03_events_schema_compatibility.sql
```

For Ticket Management V2 fields, also run:

```text
supabase/sql/04_ticket_model_v2.sql
```

For Custom Venues B-lite, also run:

```text
supabase/sql/05_custom_venues.sql
```

The `05_custom_venues.sql` file ends with `notify pgrst, 'reload schema';`; after running it, confirm the statement completed so PostgREST can see `public.custom_venues`.

It creates or updates:

- `public.profiles`
- `public.ticket_applications`
- `public.events.image_path`
- Private Supabase Storage bucket `event-images`
- RLS policies for profiles, ticket applications, and event image objects
- Events schema compatibility fields and events RLS policies when running the `03` patch
- Ticket application V2 fields for lottery rounds, applied/won/paid quantities, and manual currency conversion when running the `04` patch
- `public.custom_venues` and user-owned custom venue RLS policies when running the `05` patch

The SQL is written to be repeatable with `create table if not exists`, `alter table ... add column if not exists`, and policy replacement.

## Storage

The `event-images` bucket is private.

Event image paths must use:

```text
user_id/event_id/filename
```

Example:

```text
auth-user-id/event-id/1712345678-cover.webp
```

Storage RLS policies restrict access by checking that the first folder segment matches `auth.uid()`.

## Cloud Sync Scope

Logged-in users can sync:

- Events
- Ticket applications
- User profile
- Theme and language preferences
- Event images through Supabase Storage

Guest users continue to use localStorage only.

## Manual Checks

After running the SQL, verify:

- Magic Link login works on the deployed site.
- `profiles` row is created after login.
- `ticket_applications` rows are created for logged-in ticket records.
- `custom_venues` exists, its user-owned RLS policies exist, and the current logged-in user can insert/select/update/delete only their own custom venues.
- `events.image_path` is updated after uploading an event image.
- `event-images` contains files under `user_id/event_id/filename`.
- Incognito or mobile login with the same email shows cloud events, tickets, and settings.
