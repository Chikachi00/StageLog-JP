# StageLog JP

<details open>
<summary><strong>English</strong></summary>

StageLog JP is a personal live event archive for anime, idol, and live concert fans in Japan. It records attendance memories as ticket-style cards with venue, seat, notes, filters, local statistics, historical weather matching, seat maps, and ticket lottery management.

## Implemented Features

### V1 MVP

- Create, edit, and delete live event records
- Persist event records in `localStorage` with the key `stagelog-events`
- Ticket-style event cards
- Year, artist, venue, and keyword filters
- Seeded Japanese venue list with approximate coordinates
- Curated venue database covering major Japanese live event venues in Tokyo, Chiba, Kanagawa, Saitama, Kansai, Chubu, Kyushu, and Hokkaido
- Historical weather lookup through the Open-Meteo Archive API
- Statistics for event counts, artists, venues, and weather rankings
- Load sample data for first-time use

### V2 Enhanced UI

- Enhanced live ticket stub UI with accent bar, perforated edge, barcode decoration, category tag, and cover image support
- Theme switching with Sakura, Ocean, Night, and Classic themes
- Theme persistence in `localStorage` with the key `stagelog-theme`
- English / Chinese in-app UI language switching with persistence in `localStorage` using the key `stagelog-language`
- Event image upload using browser FileReader and base64 data URLs
- 1.5MB image size limit to protect localStorage capacity
- Enhanced statistics with event distributions, ticket type distribution, average temperature, and weather summary cards
- Timeline view grouped by year and sorted by date

### V3 Venue Seat Maps

- Data-driven venue seat maps for Tokyo Dome, Belluna Dome, K-Arena Yokohama, Ariake Arena, Makuhari Messe Event Hall, and Saitama Super Arena
- Section-based seat maps with stage, arena/floor, lower stand, upper stand, and level blocks
- Automatic section highlighting from block, level, and gate input, plus manual marker adjustment
- Venue metadata supports `mapSvg`, `mapType`, and `supportedSeatMap`
- Manual seat position picker with percentage-based x/y coordinates
- Event seat markers on venue maps
- Venues page with multi-event marker overlay and venue history
- Ticket cards indicate when a seat position has been saved
- Simplified SVG thumbnails for all built-in Japanese live venues. Detailed interactive seat maps are available for selected major venues, while other venues use category-based thumbnails as visual placeholders.

### V4 Ticket Lottery Management

- Separate `TicketApplication` model for lottery and ticket application tracking
- Persist ticket applications in `localStorage` with the key `stagelog-ticket-applications`
- Ticket Manager page with create, edit, delete, status tabs, platform filter, and search
- Ticket application form with validation for required fields, price, and quantity
- Status badges for planned, applied, waiting result, won, lost, paid, issued, attended, and cancelled
- Payment pending, ticket not issued, and overdue payment warnings
- Companion name and contact fields
- Ticket statistics for applications, win rate, planned spending, paid amount, ticket price average, platform distribution, and status distribution
- Create an EventRecord from a won, paid, issued, or attended ticket application

### Optional Supabase Cloud Sync

- Guest mode continues to use browser `localStorage`
- Supabase Auth with email Magic Link sign-in
- Logged-in users can sync EventRecord data with a Supabase `events` table protected by Row Level Security
- Import local `stagelog-events` data to the cloud without deleting local data
- Logged-in users can sync events, ticket applications, profile settings, language/theme preferences, and event images through Supabase.

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS via `@tailwindcss/vite`
- Open-Meteo Archive API
- Browser `localStorage`
- Optional Supabase Auth, Events, Tickets, profile, settings, and image cloud sync

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Optional Supabase environment variables:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Local Storage Keys

- `stagelog-events`
- `stagelog-theme`
- `stagelog-language`
- `stagelog-ticket-applications`

## Notes

- Supabase is optional. If environment variables are missing, the app falls back to localStorage mode.
- Supabase cloud sync covers Events, Tickets, profile settings, language/theme preferences, and event images.
- Guest mode still stores tickets and uploaded images locally.
- Venue maps are simplified project-owned SVG drawings, not copied from external seating charts.

登录用户可以通过 Supabase 同步参战记录、票务抽选记录、用户资料、语言/主题设置和活动图片。

## License

MIT License

</details>

---

<details>
<summary><strong>中文</strong></summary>

StageLog JP 是一个面向日本 anime / idol / live concert 粉丝的个人参战记录 Web App。它用票根风格卡片保存 Live 参战经历，包括活动、艺人、会场、座位、备注、筛选、统计、历史天气匹配、座位图和票务抽选管理。

## 已实现功能

### V1 MVP

- 新增、编辑、删除参战记录
- 使用 `localStorage` 持久化保存，key 为 `stagelog-events`
- 票根风格卡片 UI
- 按年份、艺人、会场和关键词筛选
- 内置日本常见 Live 会场及近似坐标
- 内置日本 Live / 动漫 / 偶像活动中常见的会场数据，覆盖东京、千叶、神奈川、埼玉、关西、中部、九州和北海道等地区
- 接入 Open-Meteo Archive API 获取历史小时级天气
- 统计参战数、艺人、会场和天气排行
- 提供 sample data 加载按钮

### V2 UI 美化版

- 增强票根 UI：彩色竖条、虚线票根边缘、条形码装饰、分类标签和封面图片
- 主题切换：Sakura、Ocean、Night、Classic
- 主题保存到 `localStorage`，key 为 `stagelog-theme`
- 应用内 English / 中文界面切换，并通过 `stagelog-language` 保存选择
- EventForm 支持上传活动图片，使用 FileReader 转 base64 data URL
- 图片大小限制为 1.5MB，避免占用过多 localStorage
- 增强统计：年份、艺人、会场、票种分布、平均温度和天气摘要
- Timeline 页面按年份分组、按日期倒序显示参战记录

### V3 座位图版

- 为 Tokyo Dome、Belluna Dome、K-Arena Yokohama、Ariake Arena、Makuhari Messe Event Hall 和 Saitama Super Arena 提供数据驱动分区座位图
- 座位图包含 stage、arena/floor、lower stand、upper stand 和 level blocks
- 可根据 block、level、gate 自动高亮区域，也支持手动点击微调 marker
- Venue 数据支持 `mapSvg`、`mapType`、`supportedSeatMap`
- EventForm 中支持手动点击地图保存座位百分比坐标
- 会场地图显示单个或多个参战位置 marker
- Venues 页面展示会场列表、参战次数、座位叠加和会场参战记录
- TicketCard 会提示已保存座位位置，并可跳转到会场地图

### V4 日本票务管理版

- 独立的 `TicketApplication` 类型，用于抽选、当落、入金和发券管理
- 使用 `stagelog-ticket-applications` 保存票务申请
- Tickets 页面支持新增、编辑、删除、状态 tabs、平台筛选和搜索
- TicketApplicationForm 支持字段校验
- TicketApplicationCard 显示状态 badge、价格、数量、同行者和重要日期
- 支持 Payment pending、Ticket not issued yet、overdue warning
- 支持轻量同行者管理
- Statistics 页面包含票务统计、胜率、计划支出、已支付金额和分布统计
- 当选 / 入金 / 发券 / 已参战的申请可以创建 EventRecord，并避免重复创建

### 可选 Supabase 云端同步

- 未登录访客模式继续使用浏览器 `localStorage`
- 支持 Supabase Auth 邮箱 Magic Link 登录
- 登录用户可以把 EventRecord 同步到启用 Row Level Security 的 Supabase `events` 表
- 支持将本地 `stagelog-events` 导入云端，且不会自动删除本地数据
- 本版本暂不云端同步 Tickets，也暂不上传图片到 Supabase Storage

## 技术栈

- React
- Vite
- TypeScript
- Tailwind CSS，通过 `@tailwindcss/vite` 配置
- Open-Meteo Archive API
- 浏览器 `localStorage`
- 可选 Supabase Auth 和 Events 云端同步

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

可选 Supabase 环境变量：

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 本地存储 Key

- `stagelog-events`
- `stagelog-theme`
- `stagelog-language`
- `stagelog-ticket-applications`

## 说明

- Supabase 是可选功能；如果没有配置环境变量，应用会回退到 localStorage 模式。
- Supabase 云端同步目前只覆盖 Events。
- Tickets 仍然保存在本地。
- 上传图片以 base64 data URL 保存在本地。
- 会场图是项目内自绘简化 SVG，不使用外部版权座席图。

## License

MIT License

</details>
