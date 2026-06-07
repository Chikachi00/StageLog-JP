# StageLog JP

Personal live event tracking and analytics for Japanese concerts, stage events, fan events, and ticket lotteries.

StageLog JP 是一个面向日本演出、舞台活动、粉丝活动与票务抽选场景的个人参战记录与数据分析 Web App。

- Live demo: https://stage-log-jp.vercel.app
- GitHub: https://github.com/Chikachi00/StageLog-JP

## Overview / 项目简介

StageLog JP helps fans keep structured records of live events, ticket lottery rounds, venues, seats, weather, images, and spending. It supports both a guest localStorage mode and a Supabase-backed cloud mode for logged-in users.

开发了一个面向日本演出与票务抽选场景的全栈 Web App，支持 Supabase 登录与云同步、本地模式、票务多轮抽选分组、自定义场馆管理、图片上传、备份导入导出、天气匹配，以及基于 Recharts 的数据分析仪表盘。

## Key Features / 核心功能

### Event Tracking / 参战记录

- Create, edit, delete, and filter live event records.
- Track artist, title, date, time, venue, seat, ticket type, notes, and images.
- Upload event images to Supabase Storage in cloud mode; use local previews in guest mode.
- Match historical weather by venue coordinates, event date, and start time.
- Use built-in seat maps for supported venues such as Tokyo Dome, Belluna Dome, K-Arena Yokohama, Ariake Arena, Makuhari Messe Event Hall, and Saitama Super Arena.

### Ticket Management V2 / 票务管理 V2

- Group multiple ticket lottery rounds under one performance with `ticketGroupKey`.
- Keep the data model on the single `ticket_applications` table; no `ticket_groups` table is used.
- Track `roundName`, `roundType`, platform, status, application date, result date, payment deadline, issue date, and companion.
- Track `appliedQuantity`, `wonQuantity`, and `paidQuantity`.
- Use CNY as the default display currency.
- Support manually entered exchange rates and original/display amount fields.
- No automatic exchange-rate API is used.
- Analyze platform win rate, round win rate, performance success rate, planned spending, paid amount, and average ticket price.

### Venue System / 场馆系统

- Shared searchable `VenueCombobox` for event and ticket forms.
- Built-in venue search by name, Japanese/Chinese name, alias, city, prefecture, region, country, and category.
- Supports built-in venues, saved custom venues, and recent custom venues inferred from historical event/ticket records.
- Temporary custom venue input remains available when a venue is not in the built-in list.
- Custom Venues B-lite provides a user-owned custom venue library.
- Custom venues sync through Supabase in cloud mode and use `localStorage` fallback in local mode.
- `CustomVenuesManager` supports viewing, searching, creating, editing, and deleting custom venues.
- Existing event and ticket records keep venue snapshots such as `venueName`, `city`, and `country`, so historical records remain readable even if a custom venue is deleted.

### Analytics Dashboard / 数据分析

- Attendance trends by year, month, and cumulative count.
- Artist, venue, and region distribution charts.
- Weather analytics for weather type, temperature, precipitation, wind, and weather extremes.
- Ticket analytics for status, platform distribution, win rate, spending, and average ticket price.
- Recharts rendering is wrapped by `ChartFrame` with `ResizeObserver` for stable chart sizing.

### Backup / 备份

- Export JSON backups.
- Import JSON backups in local mode and cloud merge mode.
- Backup data includes events, ticket applications, profile, settings, and optional `customVenues`.
- Event and ticket records preserve venue snapshots in backups.
- Old backups without `customVenues` remain compatible.

### Cloud Sync / 云同步

- Supabase Auth with Magic Link / Email OTP and Email + Password.
- Cloud mode syncs event records, ticket applications, user profile, language/theme settings, event images, and custom venues.
- Local mode works without Supabase and persists data in browser `localStorage`.
- Supabase Row Level Security protects user-owned data with `auth.uid()` / `user_id`.

## Tech Stack / 技术栈

- React
- TypeScript
- Vite
- Supabase Auth
- Supabase Database + Row Level Security
- Supabase Storage
- Recharts
- Open-Meteo Archive API
- Browser `localStorage`
- Responsive CSS layout
- Vercel deployment

## Architecture / 架构简述

- `events`: live event records with venue, seat, weather, image, and notes data.
- `ticketApplications`: Ticket Management V2 records using `ticketGroupKey` for multi-round grouping.
- `customVenues`: user-owned custom venue library, stored in Supabase `custom_venues` in cloud mode or `stagelog-custom-venues` in local mode.
- Built-in `venues`: static Japanese venue data used for search, venue pages, and supported seat maps.
- `analyticsUtils`: transforms event and ticket data into chart-friendly analytics models.
- `backupService`: validates, normalizes, exports, and imports backup JSON.
- Dual data mode: the app can run entirely on localStorage or sync through Supabase when authenticated.

## Data Model Highlights / 数据模型亮点

- Ticket Management V2 groups multiple lottery rounds through `ticketGroupKey` without adding a `ticket_groups` table.
- Events and tickets keep venue snapshots for safety: `venueId`, `venueName`, `city`, `country`, and optional venue metadata.
- Custom venues are stored separately in `custom_venues`, while historical records still keep their own venue snapshots.
- Currency data stores original amount, display amount, original currency, display currency, and manually entered exchange rate.
- Custom venue deletion does not batch-update historical events or ticket records.

## Setup / 本地运行

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Supabase Setup / Supabase 配置

StageLog JP works without Supabase in localStorage mode. To enable login, cloud sync, image upload, and cloud custom venue sync, configure:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Do not put a `service_role` key in frontend code, Vercel public environment variables, or committed files.

Run the SQL files that exist in this repository in the Supabase SQL Editor:

```text
supabase/sql/02_remaining_cloud_features.sql
supabase/sql/03_events_schema_compatibility.sql
supabase/sql/04_ticket_model_v2.sql
supabase/sql/05_custom_venues.sql
```

Notes:

- `02_remaining_cloud_features.sql` sets up remaining cloud features such as profiles, ticket applications, and storage-related policies.
- `03_events_schema_compatibility.sql` updates the events schema and event RLS compatibility.
- `04_ticket_model_v2.sql` adds Ticket Management V2 fields.
- `05_custom_venues.sql` adds the `custom_venues` table, user-owned RLS policies, and ends with `notify pgrst, 'reload schema';`.
- Configure Supabase Auth redirect URLs for your deployed app and any local development URL you use intentionally.
- Image upload uses the private `event-images` Storage bucket configured by the project SQL/setup flow.

See the detailed setup guide:

```text
SUPABASE_SETUP.md
```

## Local Storage Keys / 本地存储

Important localStorage keys include:

- `stagelog-events`
- `stagelog-ticket-applications`
- `stagelog-custom-venues`
- `stagelog-theme`
- `stagelog-language`

The app also uses draft/session keys for form recovery.

## Verification / 验证

Basic verification:

```bash
npm install
npm run build
```

Manual verification checklist:

- Create and edit an event record.
- Create multiple ticket lottery rounds under one performance.
- Confirm `ticketGroupKey` keeps related rounds grouped.
- Create, edit, delete, and search custom venues.
- Confirm deleting a custom venue does not delete historical event/ticket records.
- Export and import a JSON backup, including `customVenues`.
- Verify cloud mode after running the Supabase SQL files.
- Verify local mode with Supabase environment variables removed.

Additional regression notes are tracked in:

```text
VERIFICATION.md
```

## Known Limitations / 已知限制

- No automatic exchange-rate API is used; exchange rates are entered manually.
- Deleting a custom venue does not batch-update historical records.
- Existing event and ticket records keep venue snapshots.
- Custom venue seat maps are not supported yet.
- Custom venue merge/dedup tooling is not supported yet.
- Automatic geocoding is not supported yet.
- Custom venue weather lookup requires latitude and longitude.
- Some builds may show a Vite chunk size warning; this is not a TypeScript or build failure.

## Screenshots / Demo

Screenshots to be added.

## License / 许可证

MIT License
