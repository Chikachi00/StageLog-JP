# StageLog JP Development Log

This document summarizes the StageLog JP development process by product and engineering phases. It is based on the repository commit history, README, verification notes, Supabase setup notes, and the current project structure.

## 1. Project Motivation

StageLog JP was built for a specific tracking problem around Japanese concerts, stage events, fan events, and ticket lotteries. A general calendar or memo app can record dates, but it does not naturally model:

- multiple ticket lottery rounds for the same performance,
- applied / won / paid ticket quantities,
- venue and seat details,
- weather at the event time,
- spending and manual currency conversion,
- built-in and custom venue metadata,
- backup / restore needs across local and cloud modes,
- long-term analytics across artists, venues, regions, weather, and ticket results.

The product goal was to create a long-term personal archive and analytics tool rather than a one-off event note. The application therefore combines event tracking, ticket lottery management, venue data, custom venue management, weather matching, image upload, backup import/export, and analytics in one data model.

## 2. Initial Event Tracking

### Goal

The first milestone was to make StageLog JP useful as a personal live event archive. The core user flow was recording an attended or planned event with enough context to make the record meaningful later.

### Problem

The initial problem was narrower than ticket lottery management: users needed a structured record for live events instead of a generic note. Key information included artist, date, venue, seat, notes, image, and weather context.

### Design Decision

The project started with an `EventRecord` model and local persistence. This allowed the app to work as a standalone browser app before cloud sync was introduced. Built-in venue data provided useful defaults for city, country, coordinates, and later seat-map support.

### Implementation

The MVP introduced:

- event creation, editing, deletion, filtering, and listing,
- event cards styled like ticket stubs,
- localStorage persistence,
- sample event loading,
- built-in Japanese venue data,
- weather lookup through Open-Meteo Archive,
- statistics for attendance counts and distribution,
- event image handling that later evolved into cloud Storage upload.

Venue and seat information were included early because they are central to live event memory. Later iterations expanded this into venue pages, SVG thumbnails, and data-driven seat maps.

### Initial Limitation

The early model was event-centric. It worked for recording events that were planned or already attended, but it did not model the ticket lottery process before an event was secured. It could not represent several application rounds for the same performance, partial wins, payment status, or platform-level win-rate analytics.

### Result

The app became a usable local event archive and established the data foundation for later cloud sync, ticket applications, venue search, seat maps, and analytics.

## 3. Cloud Sync and Supabase Integration

### Goal

The next major goal was cross-device persistence while preserving an offline-friendly local mode.

### Problem

LocalStorage is simple and reliable for a single browser, but it cannot sync data across devices or survive browser data loss. Moving everything to the cloud immediately would make login mandatory and would complicate local-first usage.

### Design Decision

The app adopted a dual-mode architecture:

- logged-in users use cloud mode through Supabase,
- guest users continue using localStorage,
- local data can be imported into the cloud,
- Supabase RLS protects user-owned rows.

This avoided forcing authentication for basic use while still allowing durable cloud sync for users who opt in.

### Implementation

Supabase integration introduced:

- Supabase client configuration,
- Supabase Auth,
- cloud event storage,
- cloud ticket storage,
- profile and settings sync,
- image upload through Supabase Storage,
- SQL setup files for profiles, events compatibility, ticket applications, and storage policies,
- RLS policies based on `auth.uid()` / `user_id`.

Cloud write paths avoid forcing frontend-generated legacy ids into Supabase uuid columns. This was important for importing local data and sample data into cloud mode safely.

### Result

StageLog JP can run fully in local mode or sync through Supabase when authenticated. User data is isolated by RLS, and the app keeps clear cloud/local boundaries.

## 4. Profile, Settings, and Authentication Issues

### Goal

After adding Supabase, the project needed account-level polish: profile persistence, theme/language settings, and more resilient authentication UX.

### Problem

Several integration issues appeared around Supabase:

- Auth redirect URLs needed to match deployment and local development URLs.
- Magic Link testing could run into email rate limits, requiring Email + Password support.
- Profile save failures could be hard to diagnose when errors were generic.
- Schema cache or RLS mismatches could cause saves to fail even when frontend state looked valid.

### Design Decision

The app kept auth controls compact in the header and made error handling more explicit. Instead of hiding Supabase details behind a generic "save failed" message, service layers preserve useful error information.

### Implementation

The project added:

- Email + Password auth alongside Magic Link / Email OTP,
- compact header account UI,
- profile storage,
- theme and language settings,
- profile and settings sync through local/cloud paths,
- Supabase setup documentation for Auth redirect URLs,
- error messages that preserve Supabase `message`, `details`, `hint`, and `code` when available.

### Result

Authentication became easier to test, account settings became more durable, and cloud failures became diagnosable without inspecting Supabase manually first.

## 5. Ticket Management V1

### Goal

Ticket Management V1 introduced the concept of ticket applications as separate records from event attendance. This reflected the Japanese concert workflow where users often apply, wait, win or lose, pay, receive tickets, and only later attend.

### Problem

The first ticket model covered basic ticket application fields, but it did not fully describe real lottery behavior:

- a single `quantity` field was not enough,
- there was no distinction between applied quantity and won quantity,
- it could not represent multiple lottery rounds for the same performance,
- ticket spending and price display were not aligned with CNY-first usage,
- analytics could not accurately calculate quantity win rate or grouped performance success.

### Design Decision

Ticket applications were modeled independently from events so that users could track tickets before an event record existed. Won / paid / issued / attended tickets could later create or link to event records.

### Implementation

Ticket Management V1 supported:

- platform,
- status,
- quantity,
- price,
- companion,
- application/result/payment/issue dates,
- creation of event records from successful tickets,
- ticket statistics for basic win rate, planned spending, paid amount, and platform distribution.

### Result

The feature made ticket tracking possible, but the V1 model exposed the need for a more precise grouped lottery model.

## 6. Ticket Management V2: Grouped Lottery Rounds

### Goal

Ticket Management V2 was designed to represent real Japanese ticket lottery workflows: multiple rounds for one performance, different platforms or lottery phases, partial wins, payments, and round-level results.

### Problem

V1 could not answer common questions:

- "I applied for 2 tickets but won 1; how should that be represented?"
- "I applied for the same performance in several rounds; should those be separate events?"
- "How do I compare round win rate, quantity win rate, and performance success?"
- "How do I track original currency and CNY display currency without automatic exchange rates?"

### Design Decision

The core decision was to keep the single `ticket_applications` table and group related rounds with `ticketGroupKey`, instead of adding a separate `ticket_groups` table.

Reasons:

- lower schema migration complexity,
- compatibility with existing ticket records,
- fewer cloud/local storage branches,
- each lottery round remains independently editable and deletable,
- grouped UI and analytics can be derived from existing records.

The V2 quantity model replaced a single `quantity` with:

- `appliedQuantity`,
- `wonQuantity`,
- `paidQuantity`.

Currency support was also changed to a manual model:

- `currency`,
- `displayCurrency`,
- `amountOriginal`,
- `exchangeRateToDisplay`,
- `amountDisplay`,
- `unitPriceOriginal`.

CNY became the default display currency, and no automatic exchange-rate API was added.

### Implementation

Ticket Management V2 added:

- `supabase/sql/04_ticket_model_v2.sql`,
- new ticket fields in TypeScript types,
- localStorage normalization for old records,
- cloud snake_case / camelCase mapping,
- form validation for quantity and amount fields,
- grouped ticket utilities,
- group cards in `TicketManager`,
- grouped summaries for applied quantity, won quantity, paid quantity, paid amount, resolved rounds, and success rates,
- "Add lottery round to this performance",
- "Save and add another round",
- `TicketRoundPreset` to preserve event title, artist, event date, venue fields, display currency, and `ticketGroupKey`.

### Bugs / Debugging Notes

The most important edge cases were:

- ensuring new rounds inherit `ticketGroupKey`,
- preventing different dates or titles from merging incorrectly,
- preserving grouped context while resetting round-specific fields,
- keeping old ticket records compatible through fallback normalization,
- making cloud inserts avoid forcing frontend ids into Supabase uuid columns.

### Result

Ticket Management V2 can represent multiple lottery rounds per performance while preserving a simple single-table data model. Analytics can distinguish:

- quantity win rate: won quantity / applied quantity,
- round win rate: winning resolved rounds / resolved rounds,
- performance success rate: grouped performances with at least one win / resolved performances.

## 7. Form Persistence and Browser Lifecycle Bugs

### Goal

Event and ticket forms needed to survive browser lifecycle interruptions: refresh, tab switch, mobile backgrounding, pagehide, and returning from another page.

### Problem

Users could lose unfinished form input when:

- switching pages or tabs,
- mobile browsers backgrounded the app,
- editing an existing event or ticket and returning later,
- refreshing before saving.

There was also a risk that a new-form draft could contaminate an edit-form draft or vice versa.

### Design Decision

Drafts and sessions were kept local-only. They are not official records and are never written to Supabase before the user saves. The app separates:

- new event draft,
- edit event draft by event id,
- new ticket draft,
- edit ticket draft by ticket id,
- event form session,
- ticket form session.

### Implementation

The app added:

- `draftStorage`,
- localStorage draft keys such as `stagelog-event-draft-new`, `stagelog-event-draft-edit-{eventId}`, `stagelog-ticket-draft-new`, and `stagelog-ticket-draft-edit-{ticketId}`,
- form session keys such as `stagelog-event-form-session` and `stagelog-ticket-form-session`,
- versioned draft envelopes,
- restore/discard flows,
- `visibilitychange`, `pagehide`, `beforeunload`, and unmount saves,
- save/cancel/delete cleanup paths.

### Bugs / Debugging Notes

Important fixes included:

- edit drafts now include entity identity and are ignored if the id does not match,
- event edit sessions restore the same event instead of opening a blank form,
- save success clears the matching draft/session,
- File objects are not persisted in localStorage; image files must be reselected after reload.

### Result

EventForm and TicketApplicationForm are more resilient to browser lifecycle behavior without polluting official records or cloud data.

## 8. Analytics V1 and Recharts Rendering Fix

### Goal

Analytics V1 introduced visual dashboards for attendance trends and distributions.

### Problem

The app had valid analytics data and fallback lists could render, but Recharts charts sometimes appeared blank or showed only legends. The issue was not caused by Supabase, missing data, or incorrect `dataKey` alone.

### Debugging Notes

The diagnosis narrowed the issue to chart container measurement:

- data reached the Analytics component,
- fallback lists displayed values,
- chart cards existed,
- Recharts received data,
- `ResponsiveContainer` measurement was unstable inside the grid/card layout.

### Design Decision

The project replaced Recharts `ResponsiveContainer` with a custom chart wrapper:

`ChartFrame + ResizeObserver`.

The chart wrapper measures container width directly and passes explicit `width` and `height` values to BarChart / LineChart components.

### Implementation

The fix introduced:

- `ChartFrame`,
- `ResizeObserver` width measurement,
- explicit chart dimensions,
- fallback list rendering below charts,
- animation disabling for more deterministic rendering,
- more stable data shapes,
- explicit axis/grid/tooltip colors,
- `minPointSize` and visible dots where useful.

### Result

Analytics uses stable chart sizing without `ResponsiveContainer`. This became a key technical decision and remains part of the current architecture.

## 9. Analytics V2: Weather and Ticket Analytics

### Goal

Analytics V2 expanded the dashboard from attendance charts into weather and ticket performance analytics.

### Implementation

Weather analytics added:

- weather condition distribution,
- average temperature by month,
- monthly precipitation,
- wind speed ranking,
- hottest event,
- coldest event,
- rainiest event,
- windiest event.

Ticket analytics added:

- ticket status distribution,
- platform distribution,
- win rate by platform,
- monthly ticket spending,
- cumulative ticket spending,
- spending by platform,
- average ticket price by platform.

### Design Decision

Ticket analytics were updated to use V2 ticket fields:

- `appliedQuantity`,
- `wonQuantity`,
- `amountDisplay`,
- `displayCurrency`.

The app uses display-currency values for spending charts and defaults to CNY where needed. It does not hardcode JPY for current ticket spending analytics and does not perform automatic currency conversion.

### Result

The analytics dashboard now covers attendance, weather, venue/region distribution, and ticket lottery performance using the current data model.

## 10. Backup Import / Export

### Goal

Backup import/export was added to protect user data and support local/cloud migration.

### Problem

The app stores several related data sets:

- events,
- ticket applications,
- profile,
- settings,
- custom venues,
- venue snapshots inside records.

A useful backup must preserve both library-style data (`customVenues`) and record snapshots (`venueName`, `city`, `country`) so historical records remain readable even if a venue library changes.

### Design Decision

The backup format is JSON and app-level, not a database dump. It intentionally avoids Supabase secrets, sessions, and environment variables.

Cloud import does not force old backup ids into Supabase uuid columns. Instead, it writes through normal service functions so Supabase can generate or validate ids correctly. Custom venues are imported for the current user rather than trusting a backup `userId`.

### Implementation

Backup support includes:

- export of events,
- export of ticket applications,
- export of profile/settings,
- export of optional `customVenues`,
- backup validation,
- old-backup compatibility,
- local merge and replace-local import modes,
- cloud merge import,
- duplicate skipping,
- `ticketGroupKey` preservation,
- `custom:` venue id preservation,
- event/ticket venue snapshot preservation.

### Bugs / Debugging Notes

Key fixes included:

- not forcing frontend ids into Supabase uuid columns,
- including V2 ticket fields in backup normalization,
- keeping old ticket data compatible with generated group keys and CNY defaults,
- supporting old backups without `customVenues`.

### Result

Backup now supports both migration and recovery across local and cloud modes while preserving ticket grouping and venue history.

## 11. Venue UX A: Searchable and Temporary Custom Venues

### Goal

Venue UX A improved venue selection and allowed users to record venues not present in the built-in venue database.

### Problem

The original select-based venue input became limiting as venue data grew:

- built-in venue lists can never cover every livehouse or small event space,
- long selects are hard to use,
- users need search by English, Japanese, Chinese, alias, city, and region,
- temporary custom venue input is necessary for small or personal event spaces.

### Design Decision

The first custom venue approach deliberately avoided a new `custom_venues` table. Custom venue data followed event/ticket records and historical candidates were inferred from saved records.

This "A" approach kept the first implementation low-risk:

- no Supabase schema change,
- no new RLS policy,
- no separate custom venue library,
- existing records simply stored venue snapshots.

### Implementation

Venue UX A added:

- `venueSearchUtils`,
- `VenueCombobox`,
- normalized venue search,
- built-in venue search across names, aliases, city, region, and category,
- custom venue inline input,
- `custom:` venue ids,
- EventForm integration,
- TicketApplicationForm integration,
- history-based recent custom venue extraction from events and ticket applications,
- seat-map fallback for custom venues,
- weather coordinate limitation messages.

### Bugs / Debugging Notes

Custom venues required compatibility across several flows:

- EventForm save should not fail when `venueId` is not built in,
- Ticket group keys should use `custom:` ids,
- adding another ticket round should inherit custom venue fields,
- custom venues without coordinates should not break weather fetch,
- custom venues should not attempt built-in seat maps.

### Result

Users could search built-in venues or enter custom venues without schema changes. The limitation was that custom venue metadata could not be centrally managed or synced unless attached to records.

## 12. Custom Venues B-lite

### Goal

Custom Venues B-lite introduced a user-owned custom venue library while preserving the safety of record-level venue snapshots.

### Problem

Venue UX A was useful but limited:

- temporary custom venues were not a first-class library,
- aliases, notes, capacity, and coordinates were hard to maintain centrally,
- users could not proactively manage custom venues,
- cross-device custom venue sync required a formal cloud data model.

### Design Decision

B-lite added a formal `custom_venues` table, but intentionally avoided more complex venue-management features.

Included:

- user-owned custom venue library,
- Supabase RLS for select/insert/update/delete,
- localStorage fallback,
- App-level `customVenues` state,
- form integration,
- backup support,
- management UI.

Deferred:

- venue merge/dedup tooling,
- custom venue seat maps,
- delete-time batch updates to historical records,
- automatic geocoding,
- complex delete linkage behavior.

The most important data-safety decision was that events and tickets still store venue snapshots. Deleting a custom venue removes only the library entry; historical records remain readable through `venueName`, `city`, and `country`.

### Implementation

B-lite added:

- `supabase/sql/05_custom_venues.sql`,
- `CustomVenue` type,
- `customVenueService`,
- localStorage key `stagelog-custom-venues`,
- Supabase mapping functions,
- cloud/local list/create/update/delete,
- App state for `customVenues`,
- VenueCombobox formal custom venue support,
- search order:
  1. built-in venues,
  2. saved custom venues,
  3. recent inferred venues,
- EventForm and TicketApplicationForm selection/creation support,
- Backup `customVenues` export/import,
- `CustomVenuesManager` for create/edit/delete/search,
- usage count based on venue id and fallback snapshot matching.

### RLS

The `custom_venues` table uses text ids such as `custom:<uuid>` and user-owned RLS:

- users can select their own custom venues,
- users can insert their own custom venues,
- users can update their own custom venues,
- users can delete their own custom venues.

### Bugs / Debugging Notes

Key compatibility points:

- cloud import must use the current user id, not a backup user id,
- local import writes `stagelog-custom-venues`,
- old backups without `customVenues` still import,
- `custom:` ids must not be treated as Supabase uuid ids for events/tickets,
- TicketApplicationForm must preserve custom venue fields in next-round workflows,
- VenueCombobox must deduplicate saved custom venues and recent inferred venues.

### Result

StageLog JP now supports both record-derived custom venues and a first-class user custom venue library with cloud/local persistence.

## 13. Mobile UX and Navigation Polish

### Goal

The app needed to remain usable on phones, especially for forms, grouped ticket cards, venue search, and analytics charts.

### Problem

Mobile-specific issues included:

- sticky header height,
- bottom navigation covering page content,
- ticket group card overflow,
- venue candidate list overflow,
- form buttons near the viewport bottom,
- analytics chart width constraints,
- long venue names, aliases, and notes.

### Implementation

Mobile polish added:

- compact mobile header,
- bottom navigation,
- mobile More drawer,
- floating add button,
- single-column mobile form layouts,
- `scroll-margin` and bottom padding around forms,
- ticket group card responsive layout,
- VenueCombobox max-height and no-horizontal-overflow constraints,
- CustomVenuesManager single-column and long-text wrapping,
- analytics chart wrappers constrained to viewport width.

### Result

The app uses the same data and business flows on desktop and mobile while adapting navigation and layout for narrow screens.

## 14. Regression Testing and Verification

### Goal

As features accumulated, the project needed a written verification trail to prevent regressions across cloud/local mode, ticket grouping, analytics, backup, venue search, and mobile layout.

### Implementation

Verification work included:

- `npm install`,
- `npm run build`,
- `npm run typecheck` where available,
- noting missing lint/test scripts,
- documenting the Vite chunk size warning,
- HTTP smoke tests for the local Vite server,
- static checks for `ResponsiveContainer`,
- SQL setup checks,
- manual verification lists for Supabase, RLS, Auth redirect URLs, cloud/local behavior, forms, Backup, Analytics, CustomVenuesManager, VenueCombobox, and mobile layout.

### Result

`VERIFICATION.md` now records build status, known manual checks, and cross-module regression notes. The current build passes with the known Vite chunk size warning.

## 15. Current Architecture Summary

Current architecture:

- React + Vite + TypeScript frontend.
- Supabase Auth for logged-in cloud mode.
- Supabase Database + RLS for cloud records.
- Supabase Storage for event images.
- localStorage fallback for guest/local mode.
- Built-in venue database for search, venue pages, coordinates, thumbnails, and supported seat maps.
- `custom_venues` for user-owned custom venue library.
- `events` for live event records.
- `ticket_applications` for Ticket Management V2 records.
- `ticketGroupKey` for grouped lottery rounds.
- `analyticsUtils` for transforming event/ticket data into chart models.
- `backupService` for JSON export/import and normalization.
- `ChartFrame + ResizeObserver` for stable Recharts sizing.
- `VenueCombobox` for built-in/custom/recent-inferred venue search.
- `CustomVenuesManager` for custom venue library CRUD.

## 16. Known Limitations

Current known limitations:

- No automatic exchange-rate API.
- No automatic geocoding.
- No custom venue seat maps.
- Deleting a custom venue does not batch-update historical records.
- Custom venue merge/dedup tooling is not implemented.
- After customVenue deletion, historical records depend on their stored venue snapshots.
- Custom venue weather lookup requires latitude and longitude.
- Large bundles may trigger the Vite chunk size warning.
- Cloud mode depends on Supabase SQL migrations and RLS policies being correctly applied.
- Some cloud and mobile flows require manual browser/device verification.

## 17. Future Improvements

Potential future directions:

- Toast / Snackbar notification system.
- Better global search and advanced filters.
- Recent artist, platform, and venue suggestions.
- Custom venue merge/dedup tooling.
- Optional historical record batch update when a custom venue changes.
- Custom venue seat map support.
- Map picker or geocoding-assisted coordinate entry.
- Better bundle splitting.
- More automated tests for form persistence, backup import/export, ticket grouping, and venue search.
