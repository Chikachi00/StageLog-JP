# StageLog JP

<details open>
<summary><strong>中文（默认展开）</strong></summary>

## 项目简介

StageLog JP 是一个面向日本 anime / idol / live concert 粉丝的个人参战记录 Web App。它把每一次 Live 参战经历记录成票根风格卡片，并支持会场、座位、票务抽选、天气、统计、图片和云端同步。

这是一个已经完成初版 MVP 的作品集项目，不是单页 demo。项目同时支持未登录本地模式和登录后的 Supabase 云端同步模式。

- 在线地址：https://stage-log-jp.vercel.app
- GitHub：https://github.com/Chikachi00/StageLog-JP

## 当前状态

已完成初版核心功能：

- React + Vite + TypeScript 应用架构
- localStorage 本地数据持久化
- Supabase Auth 登录
- Supabase cloud sync 云端同步
- Events / Tickets / Profile / Theme / Language 多模块数据管理
- Supabase Storage 私有图片上传
- 日本 Live 会场数据库与座位图系统
- 中英文 UI 切换与主题切换
- Vercel 部署

## 核心功能

### 参战记录

- 新增、编辑、删除参战记录
- 记录活动标题、艺人、日期、时间、会场、票种、座位、备注和图片
- 票根风格 TicketCard UI
- 年份、艺人、会场和关键词筛选
- 初次使用时可加载示例数据
- 未登录时使用 `localStorage`
- 登录后使用 Supabase `events` 表同步

### 图片上传

- 未登录模式下使用本地 base64 图片预览
- 登录模式下上传到 Supabase Storage 私有 bucket：`event-images`
- Storage 路径格式：`userId/eventId/filename`
- `events.image_path` 保存 Storage 路径
- 前端使用 signed URL 显示图片
- 图片缺失或加载失败时不会显示浏览器破图图标

### 云端同步

- Supabase Auth 支持 Magic Link 和 Email + Password
- 登录用户可同步：
  - 参战记录
  - 票务抽选记录
  - 用户资料
  - 语言设置
  - 主题设置
  - 活动图片
- 所有云端用户数据通过 `user_id` / `auth.uid()` 隔离
- 支持将本地 localStorage 数据导入云端
- Supabase 未配置时自动回退到 localStorage 模式

### 会场与座位图

- 内置日本常见 Live / 动漫 / 偶像活动会场数据
- 覆盖东京、千叶、神奈川、埼玉、关西、中部、九州和北海道等地区
- 所有内置会场都有简化 SVG thumbnail
- 重点会场支持数据驱动的交互座位图：
  - Tokyo Dome
  - Belluna Dome
  - K-Arena Yokohama
  - Ariake Arena
  - Makuhari Messe Event Hall
  - Saitama Super Arena
- 支持根据 block / level / gate 自动匹配座位区域
- 支持手动点击地图保存 seat marker
- Venues 页面可叠加显示同一会场多次参战位置

### 天气与统计

- 使用 Open-Meteo Archive API 获取历史小时级天气
- 根据会场坐标、活动日期和开演时间匹配最接近的小时天气
- 显示温度、降水、风速和天气类型
- Statistics 页面包含：
  - 总参战数
  - 今年参战数
  - 不同艺人 / 会场数量
  - 最常观看艺人
  - 最常去会场
  - 最热 / 最冷 / 最大雨量 / 最大风速 Live
  - 年份、艺人、会场、票种分布

### 票务抽选管理

- 独立的 TicketApplication 数据模型
- 记录日本 Live 常见票务流程：
  - planned
  - applied
  - waiting result
  - won
  - lost
  - paid
  - issued
  - attended
  - cancelled
- 支持平台、状态、价格、数量、同行者、申请日期、当落日期、入金期限和发券日期
- 支持从当选 / 入金 / 发券 / 已参战票务记录创建参战记录
- Ticket statistics 统计当选率、计划支出、已支付金额和平台分布

### UI / UX

- 现代票根风格卡片
- Sakura / Ocean / Night / Classic 四套主题
- English / 中文应用内语言切换
- 移动端友好布局
- Header 使用紧凑登录入口，登录表单和账号菜单通过弹出面板打开
- 空状态、错误状态和加载状态都有基本处理

## 技术栈

- React
- Vite
- TypeScript
- Tailwind CSS via `@tailwindcss/vite`
- Supabase Auth
- Supabase Database + Row Level Security
- Supabase Storage
- Open-Meteo Archive API
- Browser `localStorage`
- Vercel

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## Supabase 配置（可选）

不配置 Supabase 时，应用仍然可以作为本地 Web App 使用。

如需启用登录和云端同步，请在 `.env.local` 或 Vercel 环境变量中配置：

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

不要在前端代码或 README 中写入 `service_role` key。

需要在 Supabase SQL Editor 中运行项目提供的 SQL：

```text
supabase/sql/02_remaining_cloud_features.sql
supabase/sql/03_events_schema_compatibility.sql
```

详细配置说明见：

```text
SUPABASE_SETUP.md
```

## 本地存储 Key

- `stagelog-events`
- `stagelog-ticket-applications`
- `stagelog-theme`
- `stagelog-language`

## 安全说明

- `.env` / `.env.local` 不应提交到 Git
- `node_modules/` 和 `dist/` 不应提交到 Git
- Supabase 使用 anon / publishable key
- 用户数据通过 RLS 隔离
- 图片存储 bucket 为 private
- 项目内的座位图和会场缩略图为简化自绘 SVG，不复制官方座席图

## 项目亮点

- 不只是 CRUD：包含本地/云端双模式、Auth、RLS、Storage、i18n、主题、天气 API 和座位图
- 面向明确使用场景：日本 Live / idol / anime concert 参战记录
- 处理了真实应用常见边界：UUID、RLS、signed URL、localStorage fallback、云端导入、图片失败 fallback
- 适合作为前端 / full-stack-ish 作品集项目展示

## License

MIT License

</details>

---

<details>
<summary><strong>English</strong></summary>

## Overview

StageLog JP is a personal live event archive web app for anime, idol, and live concert fans in Japan. It turns every live attendance memory into a ticket-style record with venue, seat, ticket lottery, weather, statistics, image, and cloud sync support.

This is a completed first-version MVP portfolio project, not a simple single-page demo. It supports both guest localStorage mode and logged-in Supabase cloud sync mode.

- Live demo: https://stage-log-jp.vercel.app
- GitHub: https://github.com/Chikachi00/StageLog-JP

## Current Status

The first version includes:

- React + Vite + TypeScript app architecture
- localStorage persistence
- Supabase Auth
- Supabase cloud sync
- Events / Tickets / Profile / Theme / Language data flows
- Supabase Storage private image upload
- Japanese live venue database and seat map system
- English / Chinese UI switching and theme switching
- Vercel deployment

## Features

### Event Archive

- Create, edit, and delete live event records
- Track title, artist, date, time, venue, ticket type, seat, notes, and images
- Ticket-style event cards
- Filter by year, artist, venue, and keyword
- Load sample data for first-time exploration
- Guest mode uses `localStorage`
- Cloud mode syncs with the Supabase `events` table

### Image Upload

- Guest mode keeps local base64 image previews
- Cloud mode uploads event images to the private Supabase Storage bucket `event-images`
- Storage path format: `userId/eventId/filename`
- `events.image_path` stores the Storage object path
- Signed URLs are used for display
- Missing or failed images are hidden gracefully without broken image icons

### Cloud Sync

- Supabase Auth with Magic Link and Email + Password
- Logged-in users can sync:
  - Event records
  - Ticket lottery applications
  - User profile
  - Language settings
  - Theme settings
  - Event images
- User data is isolated by `user_id` / `auth.uid()`
- Local data can be imported into the cloud
- If Supabase is not configured, the app falls back to localStorage mode

### Venues And Seat Maps

- Built-in database of common Japanese live event venues
- Covers Tokyo, Chiba, Kanagawa, Saitama, Kansai, Chubu, Kyushu, and Hokkaido
- Every built-in venue includes a simplified SVG thumbnail
- Selected major venues support data-driven interactive seat maps:
  - Tokyo Dome
  - Belluna Dome
  - K-Arena Yokohama
  - Ariake Arena
  - Makuhari Messe Event Hall
  - Saitama Super Arena
- Auto-highlight seat sections from block / level / gate input
- Manually place seat markers on the map
- Venues page overlays multiple attendance markers for the same venue

### Weather And Statistics

- Historical hourly weather lookup through the Open-Meteo Archive API
- Matches weather by venue coordinates, event date, and start time
- Displays temperature, precipitation, wind speed, and weather type
- Statistics page includes:
  - Total events
  - Events this year
  - Unique artists and venues
  - Most watched artist
  - Most visited venue
  - Hottest / coldest / rainiest / windiest live events
  - Distribution by year, artist, venue, and ticket type

### Ticket Lottery Management

- Separate `TicketApplication` model
- Tracks common Japanese ticket lottery states:
  - planned
  - applied
  - waiting result
  - won
  - lost
  - paid
  - issued
  - attended
  - cancelled
- Tracks platform, status, price, quantity, companion, application date, result date, payment deadline, and issue date
- Create event records from won / paid / issued / attended ticket applications
- Ticket statistics include win rate, planned spending, paid amount, and platform distribution

### UI / UX

- Modern ticket-stub card design
- Sakura / Ocean / Night / Classic themes
- English / Chinese in-app language switching
- Mobile-friendly responsive layout
- Compact auth entry in the header with popover login and account menu
- Empty, loading, and error states for core flows

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS via `@tailwindcss/vite`
- Supabase Auth
- Supabase Database + Row Level Security
- Supabase Storage
- Open-Meteo Archive API
- Browser `localStorage`
- Vercel

## Getting Started

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Optional Supabase Setup

The app works in localStorage mode without Supabase.

To enable authentication and cloud sync, configure these variables in `.env.local` or Vercel:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Never put a `service_role` key in frontend code or documentation.

Run the provided SQL files in the Supabase SQL Editor:

```text
supabase/sql/02_remaining_cloud_features.sql
supabase/sql/03_events_schema_compatibility.sql
```

See:

```text
SUPABASE_SETUP.md
```

## Local Storage Keys

- `stagelog-events`
- `stagelog-ticket-applications`
- `stagelog-theme`
- `stagelog-language`

## Security Notes

- Do not commit `.env` or `.env.local`
- Do not commit `node_modules/` or `dist/`
- Supabase uses the anon / publishable key
- User data is protected by RLS
- Image bucket is private
- Venue maps and thumbnails are simplified project-owned SVG drawings, not copied official seating charts

## Highlights

- More than CRUD: local/cloud modes, Auth, RLS, Storage, i18n, themes, weather API, and seat maps
- Clear product domain: Japanese live / idol / anime concert attendance archive
- Handles real app edge cases: UUIDs, RLS, signed URLs, localStorage fallback, cloud import, and image fallback
- Suitable as a frontend / full-stack-ish portfolio project

## License

MIT License

</details>
