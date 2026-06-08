# StageLog JP

Personal live event tracking, ticket lottery management, venue mapping, and analytics for Japanese concerts, stage events, fan events, and ticket lotteries.

- Live demo: https://stage-log-jp.vercel.app
- GitHub: https://github.com/Chikachi00/StageLog-JP
- Chinese README: [README.zh-CN.md](README.zh-CN.md)

## Overview

StageLog JP is a personal web app for recording live event attendance, ticket lottery rounds, venues, seats, weather, images, spending, and long-term activity history. It supports both guest localStorage mode and Supabase-backed cloud mode for authenticated users.

The project is designed around the real workflow of Japanese concerts and stage events: multiple ticket lottery rounds, venue-specific records, manually entered currency conversion, event snapshots, backup/restore, and analytics that can be reviewed over time.

## Core Features

### Event Tracking

- Create, edit, delete, and filter live event records.
- Track artist, title, date, venue, seat, ticket type, notes, and images.
- Store both doors open time and show start time.
- Upload event images to Supabase Storage in cloud mode; use local image previews in guest mode.
- Match historical weather by venue coordinates, event date, and event time.
- Use built-in seat maps for supported built-in venues.

### Ticket Management V2

- Group multiple ticket lottery rounds under one performance.
- Use `ticketGroupKey` for single-table grouping on `ticket_applications`; no `ticket_groups` table is used.
- Track `roundName`, `roundType`, platform, status, application date, result date, payment deadline, issue date, and companion.
- Track `appliedQuantity`, `wonQuantity`, and `paidQuantity`.
- Use CNY as the default display currency.
- Support original amount, display amount, and manually entered exchange rates.
- No automatic exchange-rate API is used.
- Analyze platform win rate, round win rate, performance success rate, planned spending, paid amount, and average ticket price.

### Timeline, Footprint Map, and Venue Views

- Timeline view displays event records by year with event time, weather, venue, and status metadata.
- Footprint Map displays event records with valid coordinates as map markers.
- Map points are derived from event venue snapshots, built-in venues, and custom venues.
- The map is friendly to China + Japan travel patterns and supports year and country filters.
- Records without valid coordinates are listed separately instead of breaking the map.
- Venue pages show built-in venue information, thumbnails, and custom venue management.

### Venue and Custom Venue System

- Shared searchable `VenueCombobox` for event and ticket forms.
- Search built-in venues by name, Japanese/Chinese name, alias, city, prefecture, region, country, and category.
- Search results include built-in venues, saved custom venues, and recent custom venues inferred from historical records.
- Custom Venues B-lite provides a user-owned custom venue library.
- Custom venues sync through Supabase in cloud mode and use localStorage fallback in local mode.
- `CustomVenuesManager` supports viewing, searching, creating, editing, and deleting custom venues.
- Custom venue coordinates can be reused by weather lookup and the Footprint Map.
- Existing event and ticket records keep venue snapshots, so historical records remain readable even if a custom venue is later removed.
- Built-in venue thumbnails are project-owned illustrative schematic thumbnails, not official seat maps.
- Priority venue schematic thumbnails have been refined, but they are not verified official layouts.

### Analytics Dashboard

- Attendance trends by year, month, and cumulative count.
- Artist, venue, and region distribution charts.
- Weather analytics for weather type, temperature, precipitation, wind, and weather extremes.
- Ticket analytics for status, platform distribution, win rate, spending, and average ticket price.
- Recharts rendering uses `ChartFrame` with `ResizeObserver` for stable chart sizing.

### Backup and Restore

- Export JSON backups.
- Import JSON backups in local mode and cloud merge mode.
- Backup data includes events, ticket applications, profile, settings, and optional `customVenues`.
- Event and ticket records preserve venue snapshots in backups.
- Old backups without `customVenues` remain compatible.

### Cloud Sync

- Supabase Auth with Magic Link / Email OTP and Email + Password.
- Cloud mode syncs event records, ticket applications, user profile, language/theme settings, event images, and custom venues.
- Local mode works without Supabase and stores data in browser localStorage.
- Supabase Row Level Security protects user-owned data with `auth.uid()` / `user_id`.

## Tech Stack

- React
- TypeScript
- Vite
- Supabase Auth
- Supabase Database / RLS
- Supabase Storage
- Recharts
- Leaflet
- React Leaflet
- OpenStreetMap tile layer
- Open-Meteo Archive API
- Browser localStorage
- Responsive CSS layout
- Vercel deployment

Footprint Map V1 uses Leaflet / React Leaflet with OpenStreetMap public tiles. It does not require Google Maps API or a map API key, and OpenStreetMap attribution is shown on the map.

## Architecture and Data Model Highlights

- Ticket Management V2 groups multiple lottery rounds through `ticketGroupKey`.
- No `ticket_groups` table is added.
- Event and ticket records store venue snapshots such as `venueId`, `venueName`, `city`, `country`, and optional coordinates.
- Custom Venues B-lite stores the user-owned venue library in `custom_venues`.
- Deleting a custom venue does not batch-update historical records.
- Footprint Map is a derived visualization from existing event and venue coordinates; it does not add a persisted map data model.
- Currency data stores original amount, display amount, original currency, display currency, and manually entered exchange rate.
- Venue thumbnails use generic fallback layouts plus selected dedicated schematic layouts.

## Local Setup

```bash
npm install
npm run dev
```

Production build:

```bash
npm run typecheck
npm run build
```

Generate venue thumbnails when working on thumbnail assets:

```bash
npm run generate:venue-thumbnails
```

## Supabase Setup

The app can run without Supabase in localStorage mode. To enable login, cloud sync, image upload, and cloud custom venues, configure:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Do not use a `service_role` key in frontend code, Vercel public environment variables, or committed files.

Run the SQL files that exist in the repository in Supabase SQL Editor, or through your own migration tooling. The current migration order and check scripts are documented in [supabase/sql/README.md](supabase/sql/README.md).

Current migration files:

```text
supabase/sql/01_profiles_and_user_settings.sql
supabase/sql/02_events_core.sql
supabase/sql/03_event_images_storage.sql
supabase/sql/04_ticket_applications_core.sql
supabase/sql/05_ticket_model_v2.sql
supabase/sql/06_custom_venues.sql
supabase/sql/07_events_doors_open_time.sql
```

Notes:

- Run `notify pgrst, 'reload schema';` after schema changes when needed.
- Configure Supabase Auth redirect URLs for local development and deployment.
- Configure the private `event-images` Storage bucket if image upload is enabled.
- Footprint Map V1 does not require additional Supabase SQL. It reuses existing event, built-in venue, and custom venue coordinates.

Detailed Supabase setup notes are in:

```text
SUPABASE_SETUP.md
```

## Local Storage

Main localStorage keys include:

- `stagelog-events`
- `stagelog-ticket-applications`
- `stagelog-custom-venues`
- `stagelog-theme`
- `stagelog-language`

The app also uses form draft and session keys to recover unfinished event and ticket forms.

## Verification

Basic verification:

```bash
npm install
npm run typecheck
npm run build
```

Recommended manual verification:

- Create and edit event records.
- Create multiple ticket lottery rounds under one performance.
- Confirm `ticketGroupKey` groups related rounds.
- Create, edit, delete, and search custom venues.
- Confirm custom venue coordinates work with weather lookup and Footprint Map.
- Open Footprint Map and confirm valid event coordinates render as markers.
- Confirm records missing coordinates are listed below the map.
- Export and import JSON backups with events, tickets, and custom venues.
- Run Supabase SQL and verify cloud mode.
- Remove Supabase environment variables and verify local mode.
- Confirm `custom_venues` and RLS policies exist and protect user-owned data.

More regression notes are in:

```text
VERIFICATION.md
```

## Known Limitations

- No automatic exchange-rate API; exchange rates are entered manually.
- No automatic geocoding.
- Footprint Map only displays records with valid latitude / longitude.
- Missing or invalid coordinates are listed separately.
- Footprint Map does not include route animation, heatmap, marker clustering, or region coloring.
- Deleting a custom venue does not batch-update historical records.
- Historical event and ticket records keep venue snapshots.
- Custom venue seat maps are not supported yet.
- Custom venue merge / dedup is not supported yet.
- Venue thumbnails are schematic / illustrative, not official seat maps.
- Current refined venue thumbnails are schematic, not verified official layouts.
- Custom venue weather lookup depends on latitude / longitude.
- Large bundles may trigger a Vite chunk size warning; this is not a TypeScript or build failure.

## Screenshots / Demo

Screenshots to be added.

## License

MIT License
