# StageLog JP

Personal live event tracking and analytics for Japanese concerts and ticket lotteries.

[中文](#中文版) | [English](#english-version)

## 中文版

### 项目简介

StageLog JP 是一个面向日本演出、舞台活动、粉丝活动与票务抽选场景的个人参战记录与数据分析 Web App。

它用于记录参战经历、票务抽选轮次、场馆、座位、天气、图片和支出数据。应用同时支持未登录的本地模式，以及登录后的 Supabase 云同步模式。

开发了一个面向日本演出与票务抽选场景的全栈 Web App，支持 Supabase 登录与云同步、本地模式、票务多轮抽选分组、自定义场馆管理、图片上传、备份导入导出、天气匹配，以及基于 Recharts 的数据分析仪表盘。

- Live demo: https://stage-log-jp.vercel.app
- GitHub: https://github.com/Chikachi00/StageLog-JP

### 核心功能

#### 参战记录

- 创建、编辑、删除和筛选参战记录。
- 记录艺人、活动标题、日期、时间、场馆、座位、票种、备注和图片。
- 参战记录支持开场时间和开演时间。
- Cloud mode 下图片上传到 Supabase Storage；local mode 下使用本地图片预览。
- 根据场馆经纬度、活动日期和开演时间匹配历史天气。
- 部分内置场馆支持座位图，例如 Tokyo Dome、Belluna Dome、K-Arena Yokohama、Ariake Arena、Makuhari Messe Event Hall 和 Saitama Super Arena。

#### 票务管理 V2

- 同一场公演下支持多轮抽选。
- 使用 `ticketGroupKey` 在 `ticket_applications` 单表中分组，不新增 `ticket_groups` 表。
- 支持 `roundName`、`roundType`、平台、状态、申请日期、当落日期、入金期限、发券日期和同行者。
- 支持申请张数 `appliedQuantity`、中选张数 `wonQuantity`、实际付款张数 `paidQuantity`。
- 默认展示货币为人民币 CNY。
- 支持原始金额、展示金额和手动汇率。
- 不支持自动汇率 API。
- 支持平台当选率、轮次当选率、公演获得率、计划支出、实际付款金额和平均票价统计。

#### 场馆系统

- EventForm 和 TicketApplicationForm 共用可搜索的 `VenueCombobox`。
- 内置场馆支持按场馆名、日文名、中文名、别名、城市、都道府县、地区、国家和类型搜索。
- 搜索结果支持内置场馆、正式自定义场馆和从历史记录推断出的最近自定义场馆。
- 找不到内置场馆时，可以输入临时自定义场馆。
- Custom Venues B-lite 提供用户自己的自定义场馆库。
- Cloud mode 下自定义场馆同步到 Supabase；local mode 下保存在 `localStorage`。
- `CustomVenuesManager` 支持查看、搜索、创建、编辑和删除自定义场馆。
- 历史参战 / 票务记录会保留 `venueName`、`city`、`country` 等场馆快照，避免场馆库条目删除后历史记录空白。

#### 数据分析

- 参战趋势：按年、按月和累计参战数。
- 艺人 / 场馆 / 地区分布。
- 天气分析：天气类型、气温、降水、风速和极端天气记录。
- 票务分析：申请状态、平台分布、当选率、支出和平均票价。
- Recharts 图表通过 `ChartFrame` 和 `ResizeObserver` 包装，避免响应式容器高度不稳定导致图表空白。

#### 备份与恢复

- 支持 JSON 导出。
- 支持 JSON 导入。
- 备份内容包括 events、ticket applications、profile、settings 和可选的 `customVenues`。
- Events 和 tickets 在备份中仍保留场馆快照。
- 旧备份文件没有 `customVenues` 字段时仍可导入。
- 兼容 cloud mode 和 local mode。

#### 云同步

- Supabase Auth 支持 Magic Link / Email OTP 和 Email + Password。
- Cloud mode 同步参战记录、票务记录、用户资料、语言 / 主题设置、活动图片和自定义场馆。
- Local mode 不依赖 Supabase，数据保存在浏览器 `localStorage`。
- Supabase Row Level Security 通过 `auth.uid()` / `user_id` 隔离用户数据。

### 技术栈

- React
- TypeScript
- Vite
- Supabase Auth
- Supabase Database / RLS
- Supabase Storage
- Recharts
- Open-Meteo Archive API
- Browser `localStorage`
- CSS responsive layout
- Vercel deployment

### 数据模型亮点

- Ticket Management V2 使用 `ticketGroupKey` 将同一场公演的多轮抽选分组。
- 没有新增 `ticket_groups` 表。
- Event / Ticket 会保存 `venueId`、`venueName`、`city`、`country` 和可选场馆信息快照，防止场馆库删除后历史记录空白。
- Custom Venues B-lite 使用 `custom_venues` 表维护用户自己的场馆库。
- 删除 customVenue 不会批量更新历史 records。
- 货币数据保存原始金额、展示金额、原始货币、展示货币和手动输入的汇率；不支持自动换汇。

### 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

### Supabase 配置

不配置 Supabase 时，应用仍可在 localStorage 模式下运行。若要启用登录、云同步、图片上传和云端自定义场馆同步，需要配置：

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

不要在前端代码、Vercel public 环境变量或提交文件中使用 `service_role` key。

需要在 Supabase SQL Editor 中运行仓库实际存在的 SQL 文件：

```text
supabase/sql/02_remaining_cloud_features.sql
supabase/sql/03_events_schema_compatibility.sql
supabase/sql/04_ticket_model_v2.sql
supabase/sql/05_custom_venues.sql
supabase/sql/06_events_doors_open_time.sql
```

说明：

- `02_remaining_cloud_features.sql` 配置 profiles、ticket applications 和 Storage 相关策略等云端功能。
- `03_events_schema_compatibility.sql` 更新 events schema 和 events RLS 兼容字段。
- `04_ticket_model_v2.sql` 添加 Ticket Management V2 字段。
- `05_custom_venues.sql` 添加 `custom_venues` 表和用户自有场馆 RLS policies，并包含 `notify pgrst, 'reload schema';`。
- `06_events_doors_open_time.sql` 为 events 添加 `doors_open_time text`，与现有 `start_time text` 保持一致。
- 需要在 Supabase Auth 中配置部署地址和本地开发地址的 redirect URLs。
- 图片上传使用私有 `event-images` Storage bucket；具体配置见项目 SQL 和 `SUPABASE_SETUP.md`。

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

应用还会使用表单 draft / session 相关 key 进行表单恢复。

### 验证

基础验证：

```bash
npm install
npm run build
```

建议手动验证：

- 创建和编辑参战记录。
- 在同一场公演下创建多轮票务抽选。
- 确认 `ticketGroupKey` 能将相关轮次分组。
- 创建、编辑、删除和搜索自定义场馆。
- 确认删除自定义场馆不会删除历史参战 / 票务记录。
- 导出和导入包含 `customVenues` 的 JSON 备份。
- 运行 Supabase SQL 后验证 cloud mode。
- 移除 Supabase 环境变量后验证 local mode。
- 手动确认 `custom_venues` 表和 RLS policies 存在，并且当前用户只能操作自己的 custom venues。

更多回归记录见：

```text
VERIFICATION.md
```

### 已知限制

- 不支持自动汇率 API；汇率需要手动输入。
- 删除自定义场馆不会批量更新历史 records。
- 历史 event / ticket 会保留场馆快照。
- 暂不支持自定义场馆座位图。
- 暂不支持自定义场馆合并去重。
- 暂不支持自动地理编码。
- 自定义场馆天气查询依赖经纬度。
- 大 bundle 可能出现 Vite chunk size warning；这不是 TypeScript 或 build failure。

### 截图 / Demo

截图待补充。

### 许可证

MIT License

---

## English Version

### Overview

StageLog JP is a personal live event tracking and analytics web app designed for Japanese concerts, stage events, fan events, and ticket lotteries.

It helps users keep structured records of live events, ticket lottery rounds, venues, seats, weather, images, and spending. The app supports both guest localStorage mode and Supabase-backed cloud mode for authenticated users.

Built a full-stack live event tracking and analytics web app for Japanese concerts and ticket lotteries. The app supports Supabase Auth, cloud/local data modes, grouped ticket lottery rounds, custom venue management, image upload, backup import/export, weather matching, and Recharts-based analytics dashboards.

- Live demo: https://stage-log-jp.vercel.app
- GitHub: https://github.com/Chikachi00/StageLog-JP

### Key Features

#### Event Tracking

- Create, edit, delete, and filter live event records.
- Track artist, title, date, time, venue, seat, ticket type, notes, and images.
- Event records support both doors open time and show start time.
- Upload event images to Supabase Storage in cloud mode; use local image previews in guest mode.
- Match historical weather by venue coordinates, event date, and start time.
- Use built-in seat maps for supported venues such as Tokyo Dome, Belluna Dome, K-Arena Yokohama, Ariake Arena, Makuhari Messe Event Hall, and Saitama Super Arena.

#### Ticket Management V2

- Group multiple ticket lottery rounds under one performance.
- Use `ticketGroupKey` for single-table grouping on `ticket_applications`; no `ticket_groups` table is used.
- Track `roundName`, `roundType`, platform, status, application date, result date, payment deadline, issue date, and companion.
- Track `appliedQuantity`, `wonQuantity`, and `paidQuantity`.
- Use CNY as the default display currency.
- Support manually entered exchange rates, original amount, and display amount.
- No automatic exchange-rate API is used.
- Analyze platform win rate, round win rate, performance success rate, planned spending, paid amount, and average ticket price.

#### Venue System

- Shared searchable `VenueCombobox` for event and ticket forms.
- Search built-in venues by name, Japanese/Chinese name, alias, city, prefecture, region, country, and category.
- Search results include built-in venues, saved custom venues, and recent custom venues inferred from historical records.
- Temporary custom venue input is available when a venue is not in the built-in database.
- Custom Venues B-lite provides a user-owned custom venue library.
- Custom venues sync through Supabase in cloud mode and use localStorage fallback in local mode.
- `CustomVenuesManager` supports viewing, searching, creating, editing, and deleting custom venues.
- Existing event and ticket records keep venue snapshots such as `venueName`, `city`, and `country`.

#### Analytics Dashboard

- Attendance trends by year, month, and cumulative count.
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
- Open-Meteo Archive API
- Browser localStorage
- Responsive CSS layout
- Vercel deployment

### Data Model Highlights

- Ticket Management V2 groups multiple lottery rounds through `ticketGroupKey`.
- No `ticket_groups` table is added.
- Event and ticket records store venue snapshots such as `venueId`, `venueName`, `city`, and `country`.
- Custom Venues B-lite stores the user-owned venue library in `custom_venues`.
- Deleting a custom venue does not batch-update historical records.
- Currency data stores original amount, display amount, original currency, display currency, and manually entered exchange rate.

### Local Setup

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

### Supabase Setup

The app works without Supabase in localStorage mode. To enable login, cloud sync, image upload, and cloud custom venue sync, configure:

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
supabase/sql/06_events_doors_open_time.sql
```

Notes:

- `02_remaining_cloud_features.sql` sets up remaining cloud features such as profiles, ticket applications, and storage-related policies.
- `03_events_schema_compatibility.sql` updates events schema compatibility and event RLS.
- `04_ticket_model_v2.sql` adds Ticket Management V2 fields.
- `05_custom_venues.sql` adds the `custom_venues` table and user-owned RLS policies, and includes `notify pgrst, 'reload schema';`.
- `06_events_doors_open_time.sql` adds `doors_open_time text` to events, matching the existing `start_time text` field.
- Configure Supabase Auth redirect URLs for the deployed app and any local development URL you intentionally use.
- Image upload uses the private `event-images` Storage bucket configured by the project SQL/setup flow.

See the detailed setup guide:

```text
SUPABASE_SETUP.md
```

### Local Storage

Important localStorage keys include:

- `stagelog-events`
- `stagelog-ticket-applications`
- `stagelog-custom-venues`
- `stagelog-theme`
- `stagelog-language`

The app also uses draft/session keys for form recovery.

### Verification

Basic verification:

```bash
npm install
npm run build
```

Suggested manual checks:

- Create and edit an event record.
- Create multiple ticket lottery rounds under one performance.
- Confirm `ticketGroupKey` keeps related rounds grouped.
- Create, edit, delete, and search custom venues.
- Confirm deleting a custom venue does not delete historical event/ticket records.
- Export and import a JSON backup, including `customVenues`.
- Verify cloud mode after running the Supabase SQL files.
- Verify local mode with Supabase environment variables removed.
- Confirm the `custom_venues` table and RLS policies exist, and the current user can only operate on their own custom venues.

Additional regression notes are tracked in:

```text
VERIFICATION.md
```

### Known Limitations

- No automatic exchange-rate API is used; exchange rates are entered manually.
- Deleting a custom venue does not batch-update historical records.
- Existing event and ticket records keep venue snapshots.
- Custom venue seat maps are not supported yet.
- Custom venue merge/dedup tooling is not supported yet.
- Automatic geocoding is not supported yet.
- Custom venue weather lookup requires latitude and longitude.
- Some builds may show a Vite chunk size warning; this is not a TypeScript or build failure.

### Screenshots / Demo

Screenshots to be added.

### License

MIT License
