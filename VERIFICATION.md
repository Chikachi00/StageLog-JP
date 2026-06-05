# StageLog JP Regression Verification

Verification date: 2026-06-04

## Commands Run

- `git status --short --ignored`: passed. Only ignored local artifacts were listed before edits: `.env.local`, `dist/`, `node_modules/`, and `vite-verify*.log`.
- `npm install`: passed, 0 vulnerabilities.
- `npm.cmd run build`: passed. TypeScript and Vite build completed successfully.
- `npm run lint`: script not found in `package.json`.
- `npm run test`: script not found in `package.json`.

## Build Result

- `tsc --noEmit`: passed.
- `vite build`: passed.
- Build warning: one JavaScript chunk is larger than 500 kB after minification. This is not a build failure.

## Basic Project Checks

- `.gitignore` includes `.env`, `.env.local`, `node_modules/`, `dist/`, `.DS_Store`, and `vite-verify*.log`.
- `package.json` includes `@supabase/supabase-js`.
- No Supabase keys or secrets were printed or added to committed files.

## Cloud Events

- Code checked: `src/services/cloudEventService.ts`, `src/App.tsx`, `src/components/EventForm.tsx`.
- `addCloudEvent()` inserts without passing the frontend event id, so Supabase can generate the uuid primary key.
- `addCloudEvent()` returns the database row converted back to `EventRecord`, including the Supabase-generated id.
- `updateCloudEvent()` and `deleteCloudEvent()` use the active Supabase uuid id and `user_id` filter.
- Optional strings are cleaned to `null` before cloud writes.
- `seat` writes to jsonb as an object and keeps marker fields such as `x`, `y`, `sectionId`, and `sectionLabel`.
- `weather` writes to jsonb as an object when present.
- Supabase errors are converted to messages including `message`, `details`, `hint`, and `code` where available.
- Runtime cloud insert/update/delete requires manual Supabase login verification.

## Sample Data

- Code checked: `src/App.tsx`, `src/data/sampleEvents.ts`.
- Local mode: `Load sample data` writes sample events to localStorage.
- Cloud mode: `Load sample data` calls `addCloudEvent()` for each sample event, then reloads cloud events.
- Sample event ids are not sent to Supabase on insert, avoiding non-UUID id failures.
- Sample events include title, artist, date, venueId, venueName, city, country, seat, and notes.
- Runtime cloud sample insertion requires manual Supabase login verification.

## Import Local Data

- Code checked: `src/App.tsx`, `src/services/cloudEventService.ts`.
- Import local data is only available in cloud mode.
- It reads localStorage events and de-duplicates with `title + artist + date + venueId`.
- It uploads through `addCloudEvent()`, so local ids are not forced into Supabase uuid columns.
- It does not delete localStorage data after import.
- Runtime import requires manual Supabase login verification.

## Image Rendering

- Fixed: `TicketCard` no longer renders an `<img>` when `event.imageUrl` is empty.
- Fixed: image load failure hides the cover image instead of showing a browser broken-image icon.
- localStorage base64 image URLs are still supported because valid `imageUrl` values render normally.
- Cloud Storage signed URLs are still supported because valid `imageUrl` values render normally.
- Storage upload itself requires manual login verification.

## Seat Map

- Code checked: `EventForm`, `SeatPicker`, `VenueMap`, `SeatMapRenderer`, `App` save paths.
- Local mode saves seat marker data to localStorage events.
- Cloud mode saves seat marker data to Supabase `events.seat` jsonb through `updateCloudEvent()` or event save.
- Edit flow restores `seat.x`, `seat.y`, `sectionId`, and `sectionLabel` into `SeatPicker`.
- Ticket cards display saved seat position when marker coordinates exist.
- Venues page overlays markers through `VenueMap`.
- Runtime marker cloud writes require manual Supabase login verification.

## Weather

- Code checked: `weatherService.ts` and `App.handleFetchWeather`.
- Weather fetch uses venue latitude/longitude and event date/startTime, defaulting time to 12:00.
- Future dates return a friendly "Weather data is only available after the event date." error.
- Local mode updates localStorage event weather.
- Cloud mode updates Supabase `events.weather` jsonb through `updateCloudEvent()`.
- Runtime API/network success was not re-tested in this regression run.

## Tickets

- Code checked: `cloudTicketService.ts`, `App` ticket handlers, `TicketManager`.
- Local mode uses localStorage ticket storage.
- Cloud mode uses Supabase `ticket_applications`.
- Fixed: cloud ticket insert no longer passes frontend ids, so imported legacy local ids cannot break uuid insertion.
- Fixed: Supabase ticket errors are surfaced with concrete error messages where available.
- Fixed: Create Event Record from Ticket now links to the Supabase-created event id in cloud mode.
- Runtime ticket cloud sync requires manual Supabase verification.

## Profile / Theme / Language

- Code checked: `AuthPanel`, `ProfilePanel`, `profileService`, `UserSettingsContext`.
- ProfilePanel is inside the compact account menu and no longer stays expanded in the sticky header.
- Profile save uses `profiles.id = user.id`.
- Profile load/save errors surface Supabase error details through the UI.
- Language and theme continue to save to localStorage, and cloud mode attempts to sync to `profiles`.
- Sign out returns language/theme behavior to localStorage fallback.
- Runtime profile writes require manual Supabase verification.

## Backup Export / Import

- Code added and checked: `src/types/backup.ts`, `src/services/backupService.ts`, `src/components/BackupPanel.tsx`, and `src/App.tsx`.
- Backup JSON shape includes `appName`, `version`, `exportedAt`, active `mode`, optional `userEmail`, events, ticket applications, profile, and language/theme settings.
- Backup export uses currently active app state, so local mode exports localStorage data and cloud mode exports the loaded cloud data.
- Backup JSON does not include Supabase secrets, session tokens, or environment variables.
- Event image files are not exported as separate files. Only `imageUrl` / `imagePath` metadata is included.
- Import parsing validates `appName`, supported version, and `data.events` array.
- Local import supports merge and replace-local modes.
- Cloud import supports merge mode only and does not delete existing cloud data.
- Cloud import goes through `addCloudEvent()` / `addCloudTicketApplication()`, so backup ids are not forced into Supabase uuid columns.
- Duplicate events are skipped by `title + artist + date + venueId`.
- Duplicate ticket applications are skipped by `eventTitle + artist + eventDate + platform`.
- Runtime browser download/upload and cloud import require manual UI verification.

## Mobile Responsive Navigation

- Code added and checked: `src/components/MobileBottomNav.tsx`, `src/components/MobileMenuDrawer.tsx`, `src/components/FloatingAddButton.tsx`, `src/components/Header.tsx`, and `src/index.css`.
- Desktop header navigation remains in the existing `Header` component and is hidden only below the mobile breakpoint.
- Mobile compact header shows brand, saved-record subtitle, current page label, and a More button.
- Mobile bottom navigation uses the same `activeView` and `onNavigate` props as desktop navigation.
- Mobile floating add button calls the same `onNavigate("add")` path as desktop Add Event.
- More drawer reuses existing `AuthPanel`, `ThemeSwitcher`, `LanguageSwitcher`, and `BackupPanel` components.
- No duplicate mobile-only data loading logic was added.
- No duplicate mobile-only business pages such as `MobileEventsPage`, `MobileTicketsPage`, or `MobileVenuesPage` were added.
- Runtime mobile viewport behavior requires browser/device verification.

## Supabase Schema

- Existing SQL checked: `supabase/sql/02_remaining_cloud_features.sql`.
- Added `supabase/sql/03_events_schema_compatibility.sql`.
- The new SQL patch declares/ensures all frontend-used `events` fields:
  `id`, `user_id`, `title`, `artist`, `date`, `start_time`, `venue_id`, `venue_name`, `city`, `country`, `ticket_type`, `seat`, `weather`, `notes`, `image_url`, `image_path`, `created_at`, and `updated_at`.
- The patch also includes repeatable events RLS policies for select/insert/update/delete by `auth.uid() = user_id`.
- `profiles` and `ticket_applications` fields are declared in `02_remaining_cloud_features.sql`.

## Fixes Applied In This Regression

- Prevented TicketCard broken image icons by hiding failed or missing images.
- Ensured cloud ticket inserts do not pass frontend ids into uuid columns.
- Ensured Create Event Record from Ticket links to the Supabase-generated event id in cloud mode.
- Added events schema compatibility SQL for missing cloud event fields.
- Improved ticket cloud error surfacing.
- Added JSON backup export/import with duplicate skipping and cloud-safe id handling.

## Manual Verification Still Needed

- Run `supabase/sql/03_events_schema_compatibility.sql` in Supabase SQL Editor if your events table may be missing columns or policies.
- Log in on the Vercel page.
- Add an event with only title, artist, date, and venue, then confirm Supabase Table Editor shows the row.
- Edit the event and confirm Supabase updates the row.
- Delete the event and confirm Supabase removes the row.
- Click Load sample data in cloud mode and confirm rows appear in Supabase with your `user_id`.
- Click Import local data to cloud and confirm de-duplicated rows are inserted.
- Upload an event image and confirm Storage `event-images` contains `userId/eventId/filename`.
- Confirm `events.image_path` is populated after upload.
- Save a seat marker in cloud mode and confirm `events.seat` contains marker coordinates.
- Fetch weather in cloud mode and confirm `events.weather` updates.
- Add/edit/delete ticket applications in cloud mode.
- Create Event Record from a won/paid/issued/attended ticket and confirm `linked_event_id` matches an existing cloud event id.
- Save ProfilePanel values and confirm `profiles` updates.
- Change language/theme, refresh, and confirm profile/local fallback behavior.
- Export a backup in local mode and confirm the JSON contains events and settings but no Supabase secrets.
- Import a valid backup in local mode with merge and confirm duplicates are skipped.
- Import a valid backup in local mode with replace-local and confirm local data is replaced only after confirmation.
- Export a backup after logging in and confirm it reflects cloud events/tickets currently loaded in the app.
- Import a valid backup in cloud mode and confirm Supabase receives new rows with the current user id and generated uuid ids.
- Try importing invalid JSON and confirm a specific error is shown.
- Open the app on a phone or narrow viewport and confirm the top header stays compact.
- Confirm mobile bottom navigation switches Events / Timeline / Venues / Statistics / Tickets using the same app state.
- Confirm the mobile floating Add button opens the existing EventForm.
- Confirm the mobile More drawer opens and closes, and account/theme/language/backup controls still work there.
- Confirm bottom navigation does not cover TicketCard action buttons or page bottom content.
- Log in from a phone or incognito window and confirm the same cloud Events/Tickets/Profile are visible.
