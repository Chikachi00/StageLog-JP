# StageLog JP

> 完整中英双语 README 请见 [README.md](README.md)。本文件保留为中文单独版。

StageLog JP 是一个面向日本演出、舞台活动、粉丝活动与票务抽选场景的个人参战记录、票务管理、场馆足迹和数据分析 Web App。

- Live demo: https://stage-log-jp.vercel.app
- GitHub: https://github.com/Chikachi00/StageLog-JP
- English Version: [README.md#english-version](README.md#english-version)

## 项目简介

StageLog JP 用于长期记录 live / event 参战经历、票务抽选轮次、场馆、座位、天气、图片和支出数据。应用同时支持未登录的 localStorage 本地模式，以及登录后的 Supabase 云同步模式。

这个项目重点贴合日本演出和票务抽选的真实流程：同一场公演可能有多轮抽选，票务支出需要手动折算，参战记录需要保留场馆快照，自定义场馆需要跨设备同步，数据也需要能备份和复盘。

## 快速链接

- [Live demo](https://stage-log-jp.vercel.app)
- [GitHub](https://github.com/Chikachi00/StageLog-JP)
- [完整双语 README](README.md)
- [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)
- [VERIFICATION.md](VERIFICATION.md)
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

## 核心功能

### 参战记录

- 创建、编辑、删除和筛选参战记录。
- 支持“详细卡片”和“票根墙”两种展示方式；票根墙会复用当前筛选结果，以 compact ticket-stub layout 展示参战记忆。
- 记录艺人、活动标题、日期、场馆、座位、票种、备注和图片。
- 同时支持开场时间和开演时间。
- Cloud mode 下活动图片上传到 Supabase Storage；本地模式下使用浏览器本地预览。
- 根据场馆经纬度、活动日期和活动时间匹配历史天气。
- 部分内置场馆支持项目自制座位图。

### 票务管理 V2

- 同一场公演下支持多轮抽选。
- 使用 `ticketGroupKey` 在 `ticket_applications` 单表中分组，不新增 `ticket_groups` 表。
- 记录 `roundName`、`roundType`、平台、状态、申请日、结果日、付款期限、发券日和同行者。
- 支持申请张数 `appliedQuantity`、中选张数 `wonQuantity`、实际付款张数 `paidQuantity`。
- 默认展示货币为人民币 CNY。
- 支持原始金额、展示金额和手动输入汇率。
- 不支持自动汇率 API。
- 支持平台当选率、轮次当选率、公演获得率、计划支出、实际付款金额和平均票价分析。

### 时间线、足迹图和场馆视图

- Timeline 按年份展示参战记录，并显示活动时间、天气、场馆和状态信息。
- Footprint Map / 足迹图会把有合法经纬度的参战记录显示为地图 marker。
- 足迹图会在当前年份 / 国家筛选范围内显示“已点亮城市”和“已解锁会场”视觉条。
- 地图点来自 event 场馆快照、内置场馆和自定义场馆坐标。
- 地图视图适合中国 + 日本范围，支持年份筛选和国家筛选。
- 缺少坐标或坐标无效的记录会单独列出，不会导致地图报错。
- Venues 页面展示内置场馆信息、缩略图和自定义场馆管理入口。

### 场馆和自定义场馆系统

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

### 数据分析

- 参战趋势：年度、月度和累计参战数。
- Statistics 页面包含默认折叠的参战日历热力图，以年度日历形式显示 event date 分布；同一天多场记录会用更深颜色表示。
- 艺人 / 场馆 / 地区分布。
- 天气分析：天气类型、气温、降水、风速和极端天气记录。
- 票务分析：状态、平台分布、当选率、支出和平均票价。
- Recharts 图表通过 `ChartFrame` 和 `ResizeObserver` 稳定渲染。

### 备份与恢复

- 支持 JSON 导出。
- 支持 local mode 和 cloud merge mode 下的 JSON 导入。
- 备份内容包括 events、ticket applications、profile、settings 和可选的 `customVenues`。
- events 和 tickets 在备份中仍保留场馆快照。
- 旧备份文件没有 `customVenues` 字段时仍可导入。

### 云同步

- Supabase Auth 支持 Magic Link / Email OTP 和 Email + Password。
- Cloud mode 同步参战记录、票务记录、用户资料、语言 / 主题设置、活动图片和自定义场馆。
- Local mode 不依赖 Supabase，数据保存在浏览器 localStorage。
- Supabase Row Level Security 通过 `auth.uid()` / `user_id` 隔离用户数据。

## 技术栈

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

## 架构和数据模型亮点

- Ticket Management V2 使用 `ticketGroupKey` 将同一场公演的多轮抽选分组。
- 没有新增 `ticket_groups` 表。
- Event 和 Ticket 会保存 `venueId`、`venueName`、`city`、`country` 和可选经纬度等场馆快照。
- Custom Venues B-lite 使用 `custom_venues` 表维护用户自己的场馆库。
- 删除 customVenue 不会批量更新历史 records。
- Footprint Map 是基于已有 event / venue 坐标派生出来的可视化视图，不新增持久化地图数据模型。
- 货币数据保存原始金额、展示金额、原始货币、展示货币和手动输入汇率。
- 场馆缩略图同时支持 generic fallback 和少量 dedicated schematic layouts。

## 本地运行

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

## Supabase 配置

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

## 本地存储

主要 localStorage keys：

- `stagelog-events`
- `stagelog-ticket-applications`
- `stagelog-custom-venues`
- `stagelog-theme`
- `stagelog-language`

应用还会使用表单 draft / session 相关 key 进行 EventForm 和 TicketApplicationForm 恢复。

## 验证

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

## 已知限制

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

## 截图 / Demo

截图待补充。

## License

MIT License
