# StageLog JP

Personal live event tracking, ticket lottery management, venue mapping, and analytics for Japanese concerts, stage events, fan events, and ticket lotteries.

[中文](#中文版) | [English](#english-version)

[Live Demo](https://stage-log-jp.vercel.app) · [Development Log](DEVELOPMENT_LOG.md) · [Verification](VERIFICATION.md) · [Supabase Setup](SUPABASE_SETUP.md)

---

## 中文版

### 项目简介

StageLog JP 是一个面向日本演出、舞台活动、粉丝活动与票务抽选场景的个人参战记录、票务管理、场馆足迹和数据分析 Web App。

它用于长期记录 live / event 参战经历、票务抽选轮次、场馆、座位、天气、图片和支出数据。应用同时支持未登录的 localStorage 本地模式，以及登录后的 Supabase 云同步模式。

这个项目重点贴合日本演出和票务抽选的真实流程：同一场公演可能有多轮抽选，票务支出需要手动折算，参战记录需要保留场馆快照，自定义场馆需要跨设备同步，数据也需要能备份和复盘。

### 快速链接

- [Live demo](https://stage-log-jp.vercel.app)
- [GitHub](https://github.com/Chikachi00/StageLog-JP)
- [English Version](#english-version)
- [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)
- [VERIFICATION.md](VERIFICATION.md)
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### 快速导航

- [项目简介](#项目简介)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [架构和数据模型亮点](#架构和数据模型亮点)
- [本地运行](#本地运行)
- [Supabase 配置](#supabase-配置)
- [验证](#验证)
- [已知限制](#已知限制)

### 核心功能

#### 参战记录

- 创建、编辑、删除和筛选参战记录。
- 支持“详细卡片”和“票根墙”两种展示方式；票根墙会复用当前筛选结果，以 compact ticket-stub layout 展示参战记忆。
- 记录艺人、活动标题、日期、场馆、座位、票种、备注和图片。
- 同时支持开场时间和开演时间。
- Cloud mode 下活动图片上传到 Supabase Storage；本地模式下使用浏览器本地预览。
- 根据场馆经纬度、活动日期和活动时间匹配历史天气。
- 部分内置场馆支持项目自制座位图。

#### 票务管理 V2

- 同一场公演下支持多轮抽选。
- 使用 `ticketGroupKey` 在 `ticket_applications` 单表中分组，不新增 `ticket_groups` 表。
- 记录 `roundName`、`roundType`、平台、状态、申请日、结果日、付款期限、发券日和同行者。
- 支持申请张数 `appliedQuantity`、中选张数 `wonQuantity`、实际付款张数 `paidQuantity`。
- 默认展示货币为人民币 CNY。
- 支持原始金额、展示金额和手动输入汇率。
- 不支持自动汇率 API。
- 支持平台当选率、轮次当选率、公演获得率、计划支出、实际付款金额和平均票价分析。

#### 时间线、足迹图和场馆视图

- Timeline 按年份展示参战记录，并显示活动时间、天气、场馆和状态信息。
- Footprint Map / 足迹图会把有合法经纬度的参战记录显示为地图 marker。
- 足迹图会在当前年份 / 国家筛选范围内显示“已点亮城市”和“已解锁会场”视觉条。
- 地图点来自 event 场馆快照、内置场馆和自定义场馆坐标。
- 地图视图适合中国 + 日本范围，支持年份筛选和国家筛选。
- 缺少坐标或坐标无效的记录会单独列出，不会导致地图报错。
- Venues 页面展示内置场馆信息、缩略图和自定义场馆管理入口。

#### 场馆和自定义场馆系统

- EventForm 和 TicketApplicationForm 共用可搜索的 `VenueCombobox`。
- 内置场馆支持按英文名、日文名、中文名、别名、城市、都道府县、地区、国家和类型搜索。
- 搜索结果包含内置场馆、正式自定义场馆和从历史记录推断的最近自定义场馆。
- Custom Venues B-lite 提供用户自己的自定义场馆库。
- Cloud mode 下自定义场馆通过 Supabase 同步；local mode 下保存在 localStorage。
- `CustomVenuesManager` 支持查看、搜索、创建、编辑和删除自定义场馆。
- 自定义场馆经纬度可用于天气查询和足迹图。
- 参战和票务记录会保留场馆快照，所以自定义场馆删除后历史记录仍可读。
- 内置场馆缩略图是项目自制 schematic / illustrative thumbnail，不是官方座位图。
- Priority venue thumbnails 已做 schematic refine，但不是 verified official layout。

#### 数据分析

- 参战趋势：年度、月度和累计参战数。
- Statistics 页面包含默认折叠的参战日历热力图，以年度日历形式显示 event date 分布；同一天多场记录会用更深颜色表示。
- 艺人 / 场馆 / 地区分布。
- 天气分析：天气类型、气温、降水、风速和极端天气记录。
- 票务分析：状态、平台分布、当选率、支出和平均票价。
- Recharts 图表通过 `ChartFrame` 和 `ResizeObserver` 稳定渲染。

#### 备份与恢复

- 支持 JSON 导出。
- 支持 local mode 和 cloud merge mode 下的 JSON 导入。
- 备份内容包括 events、ticket applications、profile、settings 和可选的 `customVenues`。
- events 和 tickets 在备份中仍保留场馆快照。
- 旧备份文件没有 `customVenues` 字段时仍可导入。

#### 云同步

- Supabase Auth 支持 Magic Link / Email OTP 和 Email + Password。
- Cloud mode 同步参战记录、票务记录、用户资料、语言 / 主题设置、活动图片和自定义场馆。
- Local mode 不依赖 Supabase，数据保存在浏览器 localStorage。
- Supabase Row Level Security 通过 `auth.uid()` / `user_id` 隔离用户数据。

### 技术栈

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
- 浏览器 localStorage
- 响应式 CSS layout
- Vercel deployment

Footprint Map V1 使用 Leaflet / React Leaflet 和 OpenStreetMap 公开底图，不需要 Google Maps API，也不需要地图 API key。地图中保留 OpenStreetMap attribution。

### 架构和数据模型亮点

- Ticket Management V2 使用 `ticketGroupKey` 将同一场公演的多轮抽选分组。
- 没有新增 `ticket_groups` 表。
- Event 和 Ticket 会保存 `venueId`、`venueName`、`city`、`country` 和可选经纬度等场馆快照。
- Custom Venues B-lite 使用 `custom_venues` 表维护用户自己的场馆库。
- 删除 customVenue 不会批量更新历史 records。
- Footprint Map 是基于已有 event / venue 坐标派生出来的可视化视图，不新增持久化地图数据模型。
- 货币数据保存原始金额、展示金额、原始货币、展示货币和手动输入汇率。
- 场馆缩略图同时支持 generic fallback 和少量 dedicated schematic layouts。

### 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run typecheck
npm run build
```

维护场馆缩略图时可运行：

```bash
npm run generate:venue-thumbnails
```

### Supabase 配置

不配置 Supabase 时，应用仍可在 localStorage 模式下运行。若要启用登录、云同步、图片上传和云端自定义场馆同步，需要配置：

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

不要在前端代码、Vercel public 环境变量或提交文件中使用 `service_role` key。

需要在 Supabase SQL Editor 中运行仓库实际存在的 SQL 文件，或使用自己的 migration 工具执行。当前 migration 顺序和检查脚本说明以 [supabase/sql/README.md](supabase/sql/README.md) 为准。

当前 migration 文件：

```text
supabase/sql/01_profiles_and_user_settings.sql
supabase/sql/02_events_core.sql
supabase/sql/03_event_images_storage.sql
supabase/sql/04_ticket_applications_core.sql
supabase/sql/05_ticket_model_v2.sql
supabase/sql/06_custom_venues.sql
supabase/sql/07_events_doors_open_time.sql
```

说明：

- schema 变更后如有需要，请运行 `notify pgrst, 'reload schema';`。
- 需要在 Supabase Auth 中配置本地开发地址和部署地址的 redirect URLs。
- 图片上传需要配置私有 `event-images` Storage bucket。
- Footprint Map V1 不需要额外 Supabase SQL；它复用已有 events、内置场馆和 custom venues 中的坐标。

详细配置说明见：

```text
SUPABASE_SETUP.md
```

### 本地存储

主要 localStorage keys：

- `stagelog-events`
- `stagelog-ticket-applications`
- `stagelog-custom-venues`
- `stagelog-theme`
- `stagelog-language`

应用还会使用表单 draft / session 相关 key 进行 EventForm 和 TicketApplicationForm 恢复。

### 验证

基础验证：

```bash
npm install
npm run typecheck
npm run build
```

建议手动验证：

- 创建和编辑参战记录。
- 在同一场公演下创建多轮票务抽选。
- 确认 `ticketGroupKey` 能将相关轮次分组。
- 创建、编辑、删除和搜索自定义场馆。
- 确认自定义场馆经纬度可用于天气和足迹图。
- 打开足迹图，确认有合法经纬度的 event 能显示 marker。
- 确认缺少坐标的记录会显示在地图下方。
- 导出和导入包含 events、tickets、customVenues 的 JSON 备份。
- 运行 Supabase SQL 后验证 cloud mode。
- 移除 Supabase 环境变量后验证 local mode。
- 手动确认 `custom_venues` 表和 RLS policies 存在，并且当前用户只能操作自己的 custom venues。

更多回归记录见：

```text
VERIFICATION.md
```

### 已知限制

- 不支持自动汇率 API；汇率需要手动输入。
- 不支持自动 geocoding。
- Footprint Map 只显示有合法 latitude / longitude 的记录。
- 缺少坐标或坐标无效的记录会单独列出。
- Footprint Map 暂不支持路线动画、热力图、marker 聚类或地区着色。
- 删除自定义场馆不会批量更新历史 records。
- 历史 event / ticket 会保留场馆快照。
- 暂不支持自定义场馆座位图。
- 暂不支持自定义场馆合并去重。
- 场馆缩略图是 schematic / illustrative，不是官方座位图。
- 当前 refined venue thumbnails 仍是 schematic，不是 verified official layout。
- 自定义场馆天气查询依赖经纬度。
- 大 bundle 可能出现 Vite chunk size warning；这不是 TypeScript 或 build failure。

### 截图 / Demo

截图待补充。

### License

MIT License

---

## English Version

### Overview

StageLog JP is a personal web app for recording live event attendance, ticket lottery rounds, venues, seats, weather, images, spending, and long-term activity history. It supports both guest localStorage mode and Supabase-backed cloud mode for authenticated users.

The project is designed around the real workflow of Japanese concerts and stage events: multiple ticket lottery rounds, venue-specific records, manually entered currency conversion, event snapshots, backup/restore, and analytics that can be reviewed over time.

### Quick Links

- [Live demo](https://stage-log-jp.vercel.app)
- [GitHub](https://github.com/Chikachi00/StageLog-JP)
- [中文版](#中文版)
- [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)
- [VERIFICATION.md](VERIFICATION.md)
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### Quick Navigation

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture and Data Model Highlights](#architecture-and-data-model-highlights)
- [Local Setup](#local-setup)
- [Supabase Setup](#supabase-setup)
- [Verification](#verification)
- [Known Limitations](#known-limitations)

### Core Features

#### Event Tracking

- Create, edit, delete, and filter live event records.
- Switch between detailed event cards and a compact ticket-stub Ticket Wall that reuses the current event filters.
- Track artist, title, date, venue, seat, ticket type, notes, and images.
- Store both doors open time and show start time.
- Upload event images to Supabase Storage in cloud mode; use local image previews in guest mode.
- Match historical weather by venue coordinates, event date, and event time.
- Use built-in seat maps for supported built-in venues.

#### Ticket Management V2

- Group multiple ticket lottery rounds under one performance.
- Use `ticketGroupKey` for single-table grouping on `ticket_applications`; no `ticket_groups` table is used.
- Track `roundName`, `roundType`, platform, status, application date, result date, payment deadline, issue date, and companion.
- Track `appliedQuantity`, `wonQuantity`, and `paidQuantity`.
- Use CNY as the default display currency.
- Support original amount, display amount, and manually entered exchange rates.
- No automatic exchange-rate API is used.
- Analyze platform win rate, round win rate, performance success rate, planned spending, paid amount, and average ticket price.

#### Timeline, Footprint Map, and Venue Views

- Timeline view displays event records by year with event time, weather, venue, and status metadata.
- Footprint Map displays event records with valid coordinates as map markers.
- Footprint Map includes an unlock strip for cities and venues in the current year/country filters.
- Map points are derived from event venue snapshots, built-in venues, and custom venues.
- The map is friendly to China + Japan travel patterns and supports year and country filters.
- Records without valid coordinates are listed separately instead of breaking the map.
- Venue pages show built-in venue information, thumbnails, and custom venue management.

#### Venue and Custom Venue System

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

#### Analytics Dashboard

- Attendance trends by year, month, and cumulative count.
- Live Calendar Heatmap is collapsed by default and visualizes event dates by year, with darker cells for multiple records on the same day.
- Artist, venue, and region distribution charts.
- Weather analytics for weather type, temperature, precipitation, wind, and weather extremes.
- Ticket analytics for status, platform distribution, win rate, spending, and average ticket price.
- Recharts rendering uses `ChartFrame` with `ResizeObserver` for stable chart sizing.

#### Backup and Restore

- Export JSON backups.
- Import JSON backups in local mode and cloud merge mode.
- Backup data includes events, ticket applications, profile, settings, and optional `customVenues`.
- Event and ticket records preserve venue snapshots in backups.
- Old backups without `customVenues` remain compatible.

#### Cloud Sync

- Supabase Auth with Magic Link / Email OTP and Email + Password.
- Cloud mode syncs event records, ticket applications, user profile, language/theme settings, event images, and custom venues.
- Local mode works without Supabase and stores data in browser localStorage.
- Supabase Row Level Security protects user-owned data with `auth.uid()` / `user_id`.

### Tech Stack

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

### Architecture and Data Model Highlights

- Ticket Management V2 groups multiple lottery rounds through `ticketGroupKey`.
- No `ticket_groups` table is added.
- Event and ticket records store venue snapshots such as `venueId`, `venueName`, `city`, `country`, and optional coordinates.
- Custom Venues B-lite stores the user-owned venue library in `custom_venues`.
- Deleting a custom venue does not batch-update historical records.
- Footprint Map is a derived visualization from existing event and venue coordinates; it does not add a persisted map data model.
- Currency data stores original amount, display amount, original currency, display currency, and manually entered exchange rate.
- Venue thumbnails use generic fallback layouts plus selected dedicated schematic layouts.

### Local Setup

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

### Supabase Setup

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

### Local Storage

Main localStorage keys include:

- `stagelog-events`
- `stagelog-ticket-applications`
- `stagelog-custom-venues`
- `stagelog-theme`
- `stagelog-language`

The app also uses form draft and session keys to recover unfinished event and ticket forms.

### Verification

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

### Known Limitations

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

### Screenshots / Demo

Screenshots to be added.

### License

MIT License
