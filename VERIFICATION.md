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

## Full Regression After Venue UX Integration

- EventForm regression: add/edit flow, draft persistence, image upload path, searchable built-in venues, custom venue save path, seat map fallback, and custom venue weather coordinate handling were reviewed.
- TicketForm regression: first round creation, add round from a group, save-and-add-next-round, edit/delete paths, quantity validation, CNY default currency, manual exchange behavior, draft persistence, and custom venue inheritance were reviewed.
- VenueCombobox regression: built-in search covers venue name, alias, city, prefecture, region, country, and category; historical custom venues are inferred from saved events and tickets; mobile list sizing remains constrained.
- Analytics regression: charts still use `ChartFrame` with `ResizeObserver`; ticket spending uses display currency data with CNY fallback; custom venues fall back through venue/region aggregation without requiring built-in venue ids.
- Backup regression: export/import keeps events, ticket applications, Ticket V2 fields, venue fields, and `custom:` venue ids; no separate custom venue backup field was added.
- Mobile regression: bottom navigation spacing, ticket cards, event cards, VenueCombobox lists, analytics chart wrappers, and form bottom padding were reviewed for horizontal overflow risk.
- i18n regression: VenueCombobox, Ticket V2, Analytics V2, Backup, custom venue weather, and seat map fallback keys are present in English and Chinese resources.
- Known limitations: custom venues are inferred from saved records, not stored in a separate `custom_venues` table; automatic exchange rates are not supported; custom venue weather requires coordinates.

## Custom Venues B-lite Foundation

- `custom_venues` SQL: added `supabase/sql/05_custom_venues.sql` for the user-owned custom venue library.
- RLS policies: `select`, `insert`, `update`, and `delete` policies restrict rows to `auth.uid() = user_id`.
- `customVenueService`: added cloud/local list, create, update, delete, Supabase row mapping, Supabase payload mapping, and Supabase error detail preservation.
- localStorage fallback: local custom venues use the `stagelog-custom-venues` key and parse errors fall back to an empty list.
- Backup customVenues compatibility: backup types and validation now accept optional `customVenues`; old backups without the field remain valid.
- SQL setup: `SUPABASE_SETUP.md` now documents running `supabase/sql/05_custom_venues.sql`.
- Known limitation: Custom Venues B-lite does not automatically batch update or delete historical event/ticket records; those records keep venue snapshots.
- Known limitation: App state and Backup UI wiring for exporting/importing the loaded custom venue library is reserved for a later B-lite integration stage.

## VenueCombobox / Custom Venue Verification

- VenueCombobox verification: `EventForm` and `TicketApplicationForm` use the shared searchable venue combobox with built-in venue search and historical custom venue candidates.
- EventForm custom venue: custom venues save with `custom:` venue ids plus venue name, city, country, optional prefecture/region, optional coordinates, and `isCustomVenue`.
- TicketForm custom venue: ticket applications preserve `venueId`, `venueName`, `city`, `country`, optional prefecture/region, optional latitude/longitude, and `isCustomVenue`.
- Ticket group compatibility: `ticketGroupKey` can use a `custom:` venue id, and falls back to normalized venue name if no venue id exists.
- Add round compatibility: adding another round from a ticket group and using "save and add another round" preserve custom venue details and the existing `ticketGroupKey`.
- Seat map fallback: custom venues do not use built-in seat maps; only supported built-in venues can show seat maps.
- Weather coordinate limitation: custom venues without coordinates cannot fetch weather automatically; custom venues with coordinates can still be used for weather lookup.
- Backup compatibility: backup export/import keeps venue fields on events and ticket applications, including `custom:` venue ids; no separate `customVenues` backup field is required.
- Mobile verification: VenueCombobox input, results list, touch targets, and inline custom venue form were checked for responsive CSS constraints.
- Runtime browser checks for creating/editing records should still be verified manually with real local or Supabase data.

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

## Analytics Dashboard

- Code added and checked: `src/components/Analytics.tsx` and `src/utils/analyticsUtils.ts`.
- Dependency added: `recharts`.
- Analytics uses the existing App-loaded `events`, `ticketApplications`, and `venues` arrays.
- No new Supabase requests, localStorage reads, or duplicate data-loading paths were added for Analytics.
- Added charts for attendance by year, monthly/cumulative attendance, top artists, top venues, region distribution, temperature trend, rainfall ranking, ticket status distribution, and ticket platform distribution.
- Empty states are included for missing event, weather, and ticket data.
- Desktop navigation includes Analytics.
- Mobile access is available through the existing More drawer, so the bottom nav remains compact.
- Fix checked: Analytics chart data keys now match utility outputs (`year`, `month`, `name`, `shortName`, `count`, `cumulative`, `temperature`, and `precipitation`).
- Fix checked: every Recharts `ResponsiveContainer` now receives an explicit numeric height through `CHART_HEIGHT` instead of relying on `height="100%"`.
- Fix checked: region and ticket status distributions use BarChart rendering for more stable mobile/desktop display.
- Fix checked: chart axes, grid, tooltip, bars, and lines use explicit visible colors for Sakura / Ocean / Night / Classic themes.
- Follow-up diagnosis: summary cards receiving data indicates App-loaded `events` are reaching Analytics; chart blankness was most likely in chart data shape/container rendering rather than data loading.
- Follow-up fix checked: analytics chart data now includes consistent `name` and `count` aliases for year, month, cumulative month, weather temperature, and rainfall datasets.
- Follow-up fix checked: Recharts `dataKey` usage now prefers the shared `name`/`count` shape where possible while preserving detailed labels for tooltips.
- Follow-up fix checked: chart wrappers now use `.analytics-chart-body` with explicit desktop/mobile heights, avoiding parent-height ambiguity around `ResponsiveContainer`.
- Follow-up fix checked: non-empty charts render a compact fallback data list beneath the chart so small datasets remain visible even if chart rendering is constrained by the browser.
- Follow-up check added: development builds log safe aggregate chart data through `[Analytics data]` without Supabase sessions, tokens, keys, or user objects.
- Analytics V2 weather charts added and code-checked: weather condition distribution, average temperature by month, monthly precipitation, and wind speed ranking.
- Analytics V2 ticket charts added and code-checked: ticket status distribution, platform distribution, win rate by platform, monthly spending, cumulative spending, spending by platform, and average ticket price by platform.
- Analytics V2 keeps the existing `ChartFrame` + `ResizeObserver` rendering path and does not reintroduce `ResponsiveContainer`.
- Analytics V2 uses only the App-provided `events`, `ticketApplications`, and `venues` props; no Supabase SQL, schema change, or duplicate data request was added.
- Empty-state checks are included for missing weather, resolved ticket, ticket price, and spending data.
- Chart tooltip formatting includes `JPY` for spending data and `%` for win-rate data.
- Runtime chart rendering and mobile viewport behavior require browser verification.

## Draft Autosave

- Code added and checked: `src/services/draftStorage.ts`, `src/components/EventForm.tsx`, `src/components/TicketApplicationForm.tsx`, `src/App.tsx`, and `src/index.css`.
- Event drafts are stored only in localStorage using `stagelog-event-draft-new` or `stagelog-event-draft-edit-{eventId}`.
- Ticket drafts are stored only in localStorage using `stagelog-ticket-draft-new` or `stagelog-ticket-draft-edit-{ticketId}`.
- Draft storage writes a versioned envelope with `version`, `updatedAt`, `formType`, `mode`, and `payload`.
- Invalid draft JSON is ignored and cleared instead of crashing the app.
- EventForm autosaves edited fields, seat marker data, notes, existing image metadata, and venue metadata with debounce.
- TicketApplicationForm autosaves form fields including status, platform, dates, price, quantity, companion, and memo with debounce.
- `visibilitychange`, `pagehide`, `beforeunload`, and component unmount trigger immediate draft save when the form is dirty.
- Restore/discard prompt is shown only for the matching new/edit draft key.
- Save success clears the matching draft in `App.tsx`.
- Drafts do not write to Supabase and do not enter official event/ticket arrays or statistics.
- Cloud image File objects are not saved to localStorage; users are told to reselect the file after reload.
- Runtime refresh/background recovery requires browser/mobile verification.
- Fix checked: edit event drafts now include `entityId` metadata and are ignored/cleared if the entity id does not match the current event id.
- Fix checked: EventForm edit drafts are applied automatically for the matching event id instead of requiring a restore click.
- Fix checked: navigating back to Add while an event is being edited keeps the current edit state instead of resetting to a new blank event.
- Fix checked: deleting an event clears only that event's edit draft.
- Fix checked: EventForm shows a loading state when the edited cloud event is still resolving, and a not-found state when the event is missing.
- Browser lifecycle fix checked: App-level event form session is persisted in localStorage as `stagelog-event-form-session`.
- Browser lifecycle fix checked: edit sessions store `mode: "edit"`, `editingEventId`, `currentView: "add"`, and timestamps, so a browser reload or return can reopen the same event form.
- Browser lifecycle fix checked: `pagehide`, `beforeunload`, `visibilitychange`, and `pageshow` persist or reload the event form session without writing unfinished drafts to Supabase.
- Browser lifecycle fix checked: returning to the app with an edit session restores the matching event id and lets EventForm auto-apply only `stagelog-event-draft-edit-{eventId}`.
- Browser lifecycle fix checked: saving, cancelling, or deleting an edited event clears the matching edit draft and `stagelog-event-form-session`.
- Runtime browser-level navigation recovery requires manual verification by leaving the site/tab/app and returning.

## Ticket Management V2 Phase 1

- Commands run for this phase:
  - `npm install`: passed, 0 vulnerabilities.
  - `npm.cmd run build`: passed. TypeScript and Vite build completed successfully.
  - `npm run lint`: script not found in `package.json`.
  - `npm run test`: script not found in `package.json`.
- Code added and checked: `src/types/ticket.ts`, `src/utils/ticketUtils.ts`, `src/components/TicketApplicationForm.tsx`, `src/components/TicketApplicationCard.tsx`, `src/services/ticketStorage.ts`, `src/services/cloudTicketService.ts`, and `src/App.tsx`.
- SQL added: `supabase/sql/04_ticket_model_v2.sql`.
- Ticket applications now support `ticketGroupKey`, `roundName`, `roundType`, `appliedQuantity`, `wonQuantity`, `paidQuantity`, `currency`, `displayCurrency`, `amountOriginal`, `exchangeRateToDisplay`, `amountDisplay`, and `unitPriceOriginal`.
- No `ticket_groups` table was added. `ticketGroupKey` is generated from artist, event title, event date, and venue id/name.
- Local storage normalization defaults old ticket records to `currency = CNY` and `displayCurrency = CNY`.
- Old `quantity` / `price` data remains compatible through helper fallbacks for applied quantity, won quantity, paid quantity, and displayed amount.
- Cloud ticket mapping now includes the new V2 fields with snake_case / camelCase conversion.
- Cloud insert still does not force frontend ids into Supabase uuid columns.
- TicketApplicationForm includes lottery round, quantity, and manual currency fields.
- TicketApplicationForm validates non-negative amounts/rates, positive applied quantity, won quantity <= applied quantity, and paid quantity <= won quantity.
- Manual currency conversion only uses user-entered values. No exchange-rate API or network conversion was added.
- Browser lifecycle persistence added for tickets through `stagelog-ticket-form-session`.
- Ticket edit sessions store `mode: "edit"`, `editingTicketId`, `currentView: "tickets"`, and timestamps.
- `pagehide`, `beforeunload`, `visibilitychange`, and `pageshow` persist or reload the ticket form session.
- Ticket drafts remain local-only with `stagelog-ticket-draft-new` and `stagelog-ticket-draft-edit-{ticketId}` and are never written to Supabase before Save.
- Saving, cancelling, or deleting an edited ticket clears the matching ticket draft and form session.
- Runtime cloud save for V2 fields requires manually running `supabase/sql/04_ticket_model_v2.sql` in Supabase first.

## Ticket Management V2 Phase 2

- Commands run for this phase:
  - `npm install`: passed, 0 vulnerabilities.
  - `npm.cmd run build`: passed. TypeScript and Vite build completed successfully.
  - `npm run lint`: script not found in `package.json`.
  - `npm run test`: script not found in `package.json`.
- Code added and checked: `src/components/TicketManager.tsx`, `src/utils/ticketUtils.ts`, `src/utils/statisticsUtils.ts`, `src/utils/analyticsUtils.ts`, `src/components/Analytics.tsx`, `src/components/Statistics.tsx`, `src/services/backupService.ts`, `src/index.css`, and `src/i18n/resources.ts`.
- TicketManager groups applications by `ticketGroupKey`, falling back to normalized artist, event title, event date, and venue id/name.
- No `ticket_groups` table was added.
- Group cards show event title, artist, date, venue, total applied quantity, total won quantity, resolved rounds, quantity win rate, round win rate, and paid amount with display currency.
- Each lottery round remains independently editable and deletable.
- Quantity win rate is calculated as `totalWonQuantity / totalAppliedQuantity`.
- Round win rate is calculated as winning resolved rounds divided by resolved rounds.
- Performance success rate is calculated by grouped performance: any won round makes that performance successful, divided by performances with resolved rounds.
- Platform win rate now uses applied/won quantities and resolved rounds.
- Ticket spending analytics use `amountDisplay` and `displayCurrency`, falling back through manual exchange rate or old `price` / `quantity` compatibility.
- Currency display defaults to CNY and no automatic exchange-rate API was added.
- Backup import normalization now preserves V2 fields and fills missing old backups with CNY defaults, quantity fallbacks, generated `ticketGroupKey`, and compatible amounts.
- Backup duplicate keys now include `ticketGroupKey`, round name/type, platform, and application date, with performance fields as fallback context.
- Mobile CSS was added for ticket group cards and round rows to avoid horizontal overflow.
- Runtime grouping, cloud import, mobile layout, and analytics chart behavior require browser verification.

## Ticket Group Round Creation UX

- Code added and checked: `src/components/TicketManager.tsx`, `src/components/TicketApplicationForm.tsx`, `src/App.tsx`, `src/types/ticket.ts`, `src/index.css`, and `src/i18n/resources.ts`.
- Ticket group cards now expose an explicit `Add lottery round to this performance` action.
- The add-round action passes a `TicketRoundPreset` containing `ticketGroupKey`, event title, artist, event date, venue id/name, and display currency into the existing ticket form.
- New rounds created from a group preserve the same `ticketGroupKey`; no `ticket_groups` table or new Supabase schema was added.
- The ticket form now supports `Save and add another round`, preserving the performance context while clearing round-specific fields for the next lottery round.
- The top ticket creation panel now distinguishes new performance ticket entry from adding a round to an existing performance.
- Mobile CSS was added so the creation panel and group add-round action collapse to a single-column layout.
- Manual browser verification still needed: create a second round from a group card, confirm it appears under the same group, then use save-and-add-another to enter a third round.

## Ticket Form Scroll And Focus UX

- Code added and checked: `src/components/TicketManager.tsx`, `src/components/TicketApplicationForm.tsx`, `src/App.tsx`, `src/index.css`, and `src/i18n/resources.ts`.
- TicketManager now wraps `TicketApplicationForm` in a `ticket-form-anchor` and scrolls to it when starting a new performance ticket, adding a round from an existing group, or saving and adding another round.
- The scroll behavior respects `prefers-reduced-motion` and uses `scroll-margin-top` / `scroll-margin-bottom` so sticky header and mobile bottom navigation are less likely to cover the form.
- TicketApplicationForm accepts focus requests for `eventTitle` and `roundName`.
- New performance ticket entry focuses `eventTitle`; group round entry and save-and-add-another focus `roundName`.
- Save-and-add-another now only resets and continues when the save succeeds; failed saves keep the current form values and show the save error.
- Commands run:
  - `npm install`: passed, 0 vulnerabilities.
  - `npm.cmd run build`: passed. TypeScript and Vite build completed successfully with the existing chunk size warning.
  - `npm run lint`: script not found in `package.json`.
  - `npm run test`: script not found in `package.json`.
- Manual browser verification still needed: click all three ticket add-round entry points and confirm the form scroll/focus behavior on desktop and mobile.

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
- Open Analytics from desktop navigation and confirm charts render from the current event/ticket/venue data.
- Open Analytics from the mobile More drawer and confirm charts remain inside the viewport without horizontal overflow.
- Confirm Analytics empty states display correctly when events, weather, or tickets are missing.
- Confirm switching language/theme updates Analytics labels and keeps chart cards readable.
- Confirm Analytics V2 weather charts render when weather data exists: condition distribution, monthly temperature, monthly precipitation, and wind ranking.
- Confirm Analytics V2 ticket charts render when ticket data exists: win rate by platform, spending charts, and average price by platform.
- Confirm Analytics V2 amount tooltips show JPY and win-rate tooltips show percentages.
- Confirm bottom navigation does not cover TicketCard action buttons or page bottom content.
- In Add Event, type a title, refresh, and confirm the event draft restore prompt appears.
- Restore and discard an event draft and confirm both flows behave correctly.
- Save an event and confirm the matching event draft localStorage key is cleared.
- Edit an event and confirm the `stagelog-event-draft-edit-{eventId}` key is separate from the new event draft.
- Save and restore a seat marker draft.
- Select an event image in cloud mode, refresh, and confirm the app does not crash and asks to reselect the file.
- In Tickets, type an event title, refresh, and confirm the ticket draft restore prompt appears.
- Restore and discard a ticket draft and confirm status/platform/date fields recover correctly.
- Save a ticket application and confirm the matching ticket draft localStorage key is cleared.
- On mobile, start filling EventForm and TicketApplicationForm, switch apps or background the browser, then return and confirm drafts can be recovered.
- Edit an existing event, change notes without saving, leave StageLog JP for another site/tab/app, return, and confirm the same event edit form opens automatically with the unsaved notes restored.
- Confirm `stagelog-event-form-session` is present while editing and removed after save/cancel/delete.
- Log in from a phone or incognito window and confirm the same cloud Events/Tickets/Profile are visible.
