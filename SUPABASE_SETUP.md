# StageLog JP Supabase Setup

StageLog JP can run fully in localStorage guest mode. Supabase is optional for logged-in cloud sync.

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

It creates or updates:

- `public.profiles`
- `public.ticket_applications`
- `public.events.image_path`
- Private Supabase Storage bucket `event-images`
- RLS policies for profiles, ticket applications, and event image objects

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
- `events.image_path` is updated after uploading an event image.
- `event-images` contains files under `user_id/event_id/filename`.
- Incognito or mobile login with the same email shows cloud events, tickets, and settings.
