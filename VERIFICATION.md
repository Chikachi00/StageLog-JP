# StageLog JP Supabase Verification

Verification date: 2026-06-04

## Commands Run

- `git status --short --ignored`: checked. Only ignored local files were present before verification edits.
- `git ls-files .env .env.local`: checked. No tracked env files were returned.
- `npm.cmd install`: passed, 0 vulnerabilities.
- `npm.cmd run build`: passed. Vite reported a chunk-size warning only.
- `npm run lint`: script not found.
- `npm run test`: script not found.
- Static code checks with `rg` and targeted file reads: completed for Supabase client, Auth context, Auth UI, cloud event service, i18n, README, and App data-source logic.

## Build Result

- Build status: passed.
- TypeScript check: passed through `tsc --noEmit`.
- Remaining build note: Vite warns that one JavaScript chunk is larger than 500 kB after minification. This is not a build failure.

## Supabase Integration Checks

- `src/lib/supabase.ts`: passed by code inspection.
- Environment reads: `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY` are used.
- Missing env fallback: passed by code inspection. The exported client becomes `null`, and the UI shows a Supabase-not-configured message while the app can continue in localStorage mode.
- Secret safety: passed by static scan. No real Supabase URL/key or service role key was found in tracked source or README.
- `.env.local`: passed. It is ignored and not tracked by Git.

## Auth Checks

- `src/context/AuthContext.tsx`: passed by code inspection.
- Current session loading: implemented with `supabase.auth.getSession()`.
- Auth state listener: implemented with `supabase.auth.onAuthStateChange(...)`.
- Listener cleanup: implemented with `listener.subscription.unsubscribe()`.
- Context values: `user`, `session`, `loading`, `isSupabaseConfigured`, `signInWithEmail(email)`, and `signOut()` are exposed.
- `src/components/AuthPanel.tsx`: passed by code inspection.
- Logged-out UI: email input, Send Magic Link button, and success/error messages are implemented.
- Logged-in UI: user email and Sign out button are implemented.
- Runtime Magic Link sending: not verified in this terminal session. It requires manual browser/email verification.

## Cloud Events Service Checks

- `src/services/cloudEventService.ts`: passed by code inspection.
- Implemented functions: `getCloudEvents(userId)`, `addCloudEvent(event, userId)`, `updateCloudEvent(event, userId)`, and `deleteCloudEvent(id, userId)`.
- Field mapping: passed by code inspection.
- CamelCase to snake_case mapping includes `startTime`, `venueId`, `venueName`, `ticketType`, `imageUrl`, `createdAt`, and `updatedAt`.
- `seat`: saved/restored as an object and preserves `x`, `y`, `sectionId`, and `sectionLabel`.
- `weather`: saved/restored as an object and preserves temperature, precipitation, wind speed, and weather code fields.
- Supabase errors: not silently swallowed. Service functions throw errors from Supabase responses.
- Runtime cloud writes: not verified. Writes require an authenticated Supabase session and RLS-authorized browser flow.

## Data Source Checks

- Guest/local mode: passed by code inspection. When not logged in, Events use existing `eventStorage` localStorage service.
- Cloud mode: passed by code inspection. When logged in and Supabase is configured, Events load from Supabase and create/update/delete through `cloudEventService`.
- Mode switching: passed by code inspection. Login switches to cloud mode; sign out returns to local mode through the shared refresh flow.
- Weather update persistence: passed by code inspection. Weather fetch updates are saved through Supabase in cloud mode and localStorage in local mode.
- Seat marker persistence: passed by code inspection through the same event save/update path.
- Tickets: unchanged. Ticket applications remain localStorage-backed.

## Import Local Data To Cloud

- Button/function: implemented and visible in cloud mode when local events exist.
- Source: reads local events from `stagelog-events`.
- Destination: uploads through `addCloudEvent(event, user.id)`, setting `user_id`.
- Field preservation: passed by code inspection through `toCloudEventRow(...)`.
- De-duplication: fixed during this verification. Import now skips events already in cloud and duplicate local events within the same import batch using `title + artist + date + venueId`.
- Local data retention: passed by code inspection. LocalStorage data is not deleted after import.
- Runtime import: not verified. It requires manual login and Supabase RLS-authorized write access.

## Manual Verification Still Needed

- Open the deployed Vercel app and send a Magic Link to a real email address.
- Confirm the email login link returns to the website.
- Confirm the logged-in UI displays the user email.
- Click `Import local data to cloud`.
- In Supabase Table Editor, confirm imported rows appear in the `events` table.
- While logged in, add an event and confirm a Supabase row is created.
- While logged in, edit and delete an event and confirm Supabase updates/deletes the row.
- While logged in, fetch weather and confirm the event row's `weather` JSON updates.
- While logged in, update a seat marker and confirm the event row's `seat` JSON keeps `x`, `y`, `sectionId`, and `sectionLabel`.
- Open an incognito window or phone, log in with the same email, and confirm cloud events appear.
- Sign out and confirm the app returns to localStorage mode.

## Fixes Made

- Tightened Import local data to cloud de-duplication so duplicate local records are not uploaded repeatedly in a single import batch.
- Updated this verification document with Supabase-specific verification status and manual QA checklist.
