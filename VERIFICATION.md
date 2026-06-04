# StageLog JP Cloud Features Verification

Verification date: 2026-06-04

## Commands Run

- `npm.cmd install`: passed, 0 vulnerabilities.
- `npm.cmd run build`: passed. Vite reported a chunk-size warning only.
- `npm run lint`: script not found.
- `npm run test`: script not found.
- Static checks: completed for SQL migration, cloud services, App cloud/local branching, Storage path handling, profile/settings context, and documentation.

## Build Result

- TypeScript: passed through `tsc --noEmit`.
- Production build: passed through `vite build`.
- Remaining note: one JavaScript chunk is larger than 500 kB after minification. This is not a build failure.

## SQL / Supabase Setup

- Added `supabase/sql/02_remaining_cloud_features.sql`.
- The SQL creates `profiles`, `ticket_applications`, private `event-images` bucket, Storage RLS policies, and `events.image_path`.
- The SQL uses repeatable patterns such as `create table if not exists`, `alter table ... add column if not exists`, and `drop policy if exists`.
- The SQL must be run manually in Supabase SQL Editor before the new cloud features can be fully used.

## Tickets Cloud Sync

- `src/services/cloudTicketService.ts`: implemented.
- Implemented functions: `getCloudTicketApplications`, `addCloudTicketApplication`, `updateCloudTicketApplication`, and `deleteCloudTicketApplication`.
- Field mapping between frontend camelCase and database snake_case was checked.
- App behavior by code inspection:
  - Guest mode uses localStorage ticket storage.
  - Cloud mode uses Supabase `ticket_applications`.
  - Import local tickets to cloud uses `eventTitle + artist + eventDate + platform` de-duplication.
  - Ticket statistics receive the active ticket list, so they work in local or cloud mode.
  - Create Event Record from Ticket writes events to the active event source and updates `linkedEventId` in the active ticket source.
- Runtime ticket cloud writes require manual login verification.

## Profile And Settings Sync

- `src/types/profile.ts`: implemented.
- `src/services/profileService.ts`: implemented.
- `src/context/UserSettingsContext.tsx`: implemented.
- App behavior by code inspection:
  - Login loads or creates a profile row.
  - Default profile language/theme come from localStorage.
  - Logged-in language/theme updates write to localStorage and `profiles`.
  - Logged-out language/theme continue to use localStorage.
  - Profile load/save errors are surfaced without blocking the app.
- `src/components/ProfilePanel.tsx`: implemented.
- Runtime profile writes require manual login verification.

## Storage Checks

- `src/services/storageService.ts`: implemented.
- Bucket name: `event-images`.
- File path format: `userId/eventId/timestamp-safeFileName`.
- Upload size limit: 5MB.
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Cloud event mapping includes `image_path`.
- Cloud mode image flow by code inspection:
  - New event is created first.
  - Selected image uploads to Supabase Storage.
  - `events.image_path` is updated after upload.
  - Signed URL is fetched for display.
  - Signed URLs and base64 data URLs are not written back into `image_url` when `imagePath` exists.
  - Replacing/deleting an image attempts to remove the old Storage object.
- Guest mode keeps the existing base64 localStorage image behavior.
- Runtime Storage upload requires manual login verification.

## LocalStorage Fallback

- Events: localStorage fallback preserved.
- Tickets: localStorage fallback preserved.
- Images: base64 localStorage flow preserved for guest mode.
- Theme/language: localStorage fallback preserved after sign out or when Supabase is not configured.

## Documentation

- Added `SUPABASE_SETUP.md`.
- Updated `README.md` with the expanded cloud sync scope.
- No `.env` or `.env.local` content was added to documentation.

## Manual Verification Still Needed

- Run `supabase/sql/02_remaining_cloud_features.sql` in Supabase SQL Editor.
- Log in on the Vercel app with Magic Link.
- Add a ticket application and confirm Supabase Table Editor shows a `ticket_applications` row.
- Edit and delete a ticket application in cloud mode.
- Click Import local tickets to cloud and confirm imported rows.
- Create Event Record from a won/paid/issued/attended ticket in cloud mode and confirm `linked_event_id` updates.
- Change language, refresh, and confirm `profiles.language` persists.
- Change theme, refresh, and confirm `profiles.theme` persists.
- Save display name, username, and home region from ProfilePanel and confirm `profiles` updates.
- Upload an event image and confirm `event-images` contains `userId/eventId/filename`.
- Confirm `events.image_path` is populated after image upload.
- Replace and remove an event image and confirm the UI does not crash.
- Log in from another browser/device with the same email and confirm Events, Tickets, Profile, language/theme, and images sync.
