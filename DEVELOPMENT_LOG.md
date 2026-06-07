# StageLog JP Development Log

This document is a bilingual development retrospective for StageLog JP. It covers product iteration, technical decisions, critical bugs, architecture evolution, verification notes, and known limitations.

[中文](#中文版) | [English](#english-version)

---

## 中文版

这份开发日志基于 Git commit history、README、VERIFICATION、Supabase 配置说明和当前项目结构整理。它不是逐 commit 流水账，而是按产品阶段和工程问题复盘 StageLog JP 的演进过程。

### 0. 项目结构解读

```text
StageLog-JP/
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── i18n/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── public/
│   ├── venue-maps/
│   └── venue-thumbnails/
├── scripts/
│   └── generateVenueThumbnails.mjs
├── supabase/
│   └── sql/
│       ├── checks/
│       ├── README.md
│       ├── 01_profiles_and_user_settings.sql
│       ├── 02_events_core.sql
│       ├── 03_event_images_storage.sql
│       ├── 04_ticket_applications_core.sql
│       ├── 05_ticket_model_v2.sql
│       ├── 06_custom_venues.sql
│       └── 07_events_doors_open_time.sql
├── README.md
├── README.zh-CN.md
├── DEVELOPMENT_LOG.md
├── VERIFICATION.md
├── SUPABASE_SETUP.md
├── package.json
├── package-lock.json
├── vite.config.ts
└── tsconfig.json
```

这一节用于解释 StageLog JP 仓库的主要目录和文件如何协作。它不是完整文件树，而是从职责边界和数据流角度说明项目结构。

#### 0.1 顶层结构

- `README.md`：项目展示页和本地运行 / Supabase 配置入口，面向 GitHub 读者和未来维护者。
- `README.zh-CN.md`：中文 README 入口，用于中文读者快速查看项目说明。
- `DEVELOPMENT_LOG.md`：开发过程复盘，记录产品阶段、关键 bug、技术取舍、架构演进和已知限制。
- `VERIFICATION.md`：构建、回归检查和手动验证记录，特别用于记录 cloud/local mode、Supabase SQL、RLS、表单、票务、Analytics、Backup 和移动端检查。
- `SUPABASE_SETUP.md`：Supabase 配置说明，包括 Auth、环境变量、SQL、Storage 和云端同步相关事项。
- `package.json` / `package-lock.json`：项目依赖和脚本。当前主要脚本包括 `dev`、`build`、`preview`、`typecheck` 和 venue thumbnail 生成脚本。
- `vite.config.ts`：Vite 构建配置。
- `tsconfig.json`：TypeScript 编译配置。
- `scripts/`：辅助脚本目录，目前包含 venue thumbnail 生成脚本。
- `public/`：静态资源目录，包括 venue maps 和 venue thumbnails 等可直接由前端引用的资源。
- `supabase/sql/`：Supabase schema migration 和检查脚本目录。这里是数据库结构记录，不是运行时代码。
- `src/`：React + TypeScript 前端应用主体。

#### 0.2 `src` 目录

`src` 是 React + TypeScript 前端应用主体。它包含应用入口、全局协调层、业务组件、数据 service、类型定义、工具函数、静态数据和 i18n 文案。`src` 内部的核心关系是：`main.tsx` 挂载应用，`App.tsx` 统筹全局状态和业务流程，`components` 负责 UI 和用户输入，`services` 负责 cloud/local 数据读写，`types` 和 `utils` 负责数据模型与纯函数逻辑。

##### `main.tsx`

`main.tsx` 是 React 应用入口。它从 DOM 中找到 `root` 节点并挂载 `App`，同时完成应用启动阶段需要的轻量初始化：`StrictMode`、`AuthProvider`、`UserSettingsProvider`、i18n 初始化和全局 CSS 引入。

它的职责应该保持轻量：启动 React、接入全局 provider、加载全局资源。events、tickets、Supabase CRUD、backup、weather 等业务逻辑不放在这里，这样入口层不会和业务流程耦合。

##### `App.tsx`

`App.tsx` 是当前项目的全局协调层，不只是普通页面组件。它把页面状态、用户状态、业务数据和 service 调用连接起来，并负责多个模块之间的联动。

它主要协调：

- 页面 / tab 切换，例如参战记录、时间线、会场、统计、数据分析、票务、新增参战等视图。
- cloud mode / local mode 的切换和状态管理。
- Supabase Auth 用户状态和本地模式状态的协调。
- events state：参战记录加载、新增、编辑、删除、导入、天气更新、图片更新。
- ticketApplications state：票务抽选记录加载、新增、编辑、删除、`ticketGroupKey` 分组相关操作。
- customVenues state：自定义场馆库加载、新增、编辑、删除，并传给 `VenueCombobox`、`EventForm` 和 `TicketApplicationForm`。
- profile / settings：用户 profile、语言、主题、显示设置等状态。
- backup import/export：把 events、tickets、profile/settings、customVenues 等传给 `BackupPanel` / `backupService`。
- form preset 和跳转：例如从 ticket 创建 event、ticket round 编辑自动滚动、EventForm / TicketForm 的新增/编辑状态。
- weather fetch：协调 event/form 中的坐标、built-in venues、customVenues 和 `weatherService`。
- image upload：协调 `EventForm`、`storageService`、event `image_path` / `imageUrl`。
- draft/session：配合 `EventForm` / `TicketApplicationForm` 保持浏览器切换、刷新、移动端后台后的表单状态。
- 把 services 的返回结果统一写回 React state。

`App.tsx` 的典型数据流是：

```text
UI 组件触发操作
  ↓
App.tsx handler
  ↓
根据 cloud/local mode 调用 Supabase service 或 localStorage fallback
  ↓
返回结果写回统一 state
  ↓
Timeline / Cards / Analytics / Backup 重新读取 state 渲染
```

`App.tsx` 当前职责比较重，这是项目从单页应用持续演进形成的“应用协调层”。它的好处是方便协调 Event、Ticket、Venue、Backup、Weather、Auth 等模块之间的联动。未来如果继续扩大，可以考虑拆分为 `useEventsController`、`useTicketsController`、`useCustomVenuesController`、`useBackupController`、`useWeatherController` 和 route/view state controller，但这些目前只是可选重构方向，并不是已经实现的结构。

##### `index.css`

`index.css` 是全局样式入口，主要承担主题、响应式布局和组件样式。当前项目没有采用 CSS modules 或 Tailwind，因此很多 UI polish 都集中在这里。

它覆盖：

- 主题色、背景、字体、按钮、表单、卡片、badge 等基础样式。
- Sakura / Ocean / Night / Classic 等主题样式。
- 移动端 header、bottom nav、drawer、floating add button 等 responsive layout。
- Timeline、ticket group card、VenueCombobox、CustomVenuesManager、Analytics chart frame 等组件样式。
- 长文本换行、表单底部 padding、候选列表滚动、图表容器宽度等移动端可用性细节。

这种集中样式方式方便快速迭代和统一全局视觉，但也让 `index.css` 承担了较多责任。未来如果样式继续膨胀，可以按组件拆分 CSS 文件；当前阶段保持集中样式更利于维护现有单页应用的整体一致性。

#### 0.3 `src/components`

`components` 目录包含可复用 UI 和业务组件：

- `EventForm`：新增 / 编辑参战记录，处理 doorsOpenTime、startTime、VenueCombobox、座位、图片、draft/session 和保存。
- `TicketApplicationForm`：新增 / 编辑票务抽选轮次，处理 Ticket Management V2 字段、数量校验、货币字段、round preset 和 draft/session。
- `TicketManager`：展示 ticket group card、按 `ticketGroupKey` 聚合同一场公演的多轮抽选，并提供新增轮次、编辑轮次、删除轮次和从 ticket 创建 event 的入口。
- `VenueCombobox`：统一场馆选择入口，合并 built-in venues、正式 `customVenues` 和 recent inferred venues，并支持 inline 创建 customVenue。
- `CustomVenuesManager`：自定义场馆库管理 UI，支持新增、编辑、删除、搜索和 event/ticket usage count。
- `BackupPanel`：JSON backup export/import 的 UI。
- `Analytics` 和 `ChartFrame`：数据分析和 Recharts 稳定渲染。图表使用 ChartFrame + ResizeObserver 测量尺寸，不再依赖 ResponsiveContainer。
- `Timeline`：按年份展示参战记录时间线，后续加入了日期列、节点、竖线、时间 badge、天气 badge 和 upcoming/completed 状态 badge。
- `TicketCard` / `EventList`：参战记录卡片和列表展示，也承载天气获取入口、图片、座位摘要和编辑/删除入口。
- `Header`、`MobileBottomNav`、`MobileMenuDrawer`、`FloatingAddButton`：桌面和移动端导航。

#### 0.4 `src/services`

`services` 是数据读写和外部 API 访问层。UI 组件不应该直接拼 Supabase row，而是通过 App handler 和 service 层处理映射。

- `cloudEventService`：`events` 的 Supabase row 映射和 cloud CRUD，包括 `start_time`、`doors_open_time`、venue snapshot、seat/weather JSON 和 image 字段。
- `cloudTicketService`：`ticket_applications` 的 Supabase row 映射和 cloud CRUD，包含 Ticket Management V2 字段和 `ticketGroupKey`。
- `customVenueService`：`custom_venues` 的 cloud/local CRUD，支持 localStorage fallback key `stagelog-custom-venues`，并清洗 latitude / longitude / capacity 等字段。
- `eventStorage` / `ticketStorage`：localStorage fallback 的 events 和 ticket applications 读写。
- `backupService`：JSON backup import/export、旧 backup 兼容、customVenues 兼容、event/ticket venue snapshots 保留。
- `storageService`：event image 上传、signed URL 和删除，依赖 Supabase Storage。
- `weatherService`：Open-Meteo Archive 天气获取。坐标由上层统一解析后传入，不在 service 内查 venue 数据。
- `profileService`、`draftStorage`：profile/settings 云端持久化和表单 draft/session 持久化。

#### 0.5 `src/types`

`types` 定义核心数据模型：

- `EventRecord` / `EventFormValues`：参战记录，包括 `doorsOpenTime`、`startTime`、venue snapshot、seat、weather、image、notes。
- `TicketApplication`：票务抽选轮次，包括 `ticketGroupKey`、roundName / roundType、appliedQuantity / wonQuantity / paidQuantity、currency / displayCurrency、amountOriginal / amountDisplay 等 V2 字段。
- `CustomVenue`：用户自定义场馆库记录，包括 aliases、city/country、prefecture/region、latitude/longitude、category、capacity、notes。
- `Backup` 相关类型：定义 JSON backup 的 events、ticketApplications、profile/settings、customVenues 等结构。
- `Venue`：内置场馆数据类型，包含坐标、地区、类别、容量、座位图和缩略图信息。

#### 0.6 `src/utils`

`utils` 是纯函数工具层：

- `ticketUtils`：`ticketGroupKey` 生成/归一化、票务数量和金额读取、分组相关计算。
- `analyticsUtils`：把 events 和 tickets 转成 Analytics V1/V2 所需的图表数据。
- `venueSearchUtils`：场馆搜索、搜索文本归一化、历史自定义场馆提取、custom venue id 生成，以及 custom venue 天气坐标解析。
- `dateUtils`：日期、时间、doors/start 展示格式和排序。
- `seatMapUtils`：内置座位图查找和座位图兼容判断。
- `statisticsUtils`、`weatherUtils`：统计和天气展示辅助函数。

#### 0.7 `src/data`

`data` 保存静态数据和内置数据源：

- `venues.ts`：内置日本 live venue 数据，包括英文名、日文/中文名、aliases、城市、地区、坐标、category、capacity、seat map 支持和 thumbnail 信息。
- `seatMaps.ts`：数据驱动的内置场馆 seat map 定义。
- `sampleEvents.ts`：示例参战记录，用于空状态体验和本地验证。

#### 0.8 `src/i18n`、`src/context` 和 `src/lib`

- `src/i18n`：中文/英文文案资源和 i18next 初始化。VenueCombobox、CustomVenuesManager、Ticket V2、Timeline、Backup、weather、seat map、Analytics 等文案都在这里维护。
- `src/context`：Auth 和 user settings 上下文，封装 Supabase session、cloud/local mode 所需的用户状态，以及 theme/language/profile 相关状态。
- `src/lib/supabase.ts`：Supabase client 初始化，读取 Vite 环境变量。前端只使用 anon/publishable key，不使用 service role key。

#### 0.9 `supabase/sql`

`supabase/sql` 是数据库 schema 和 migration 记录。它不会在 push 到 GitHub 后自动修改 Supabase 数据库；需要手动复制到 Supabase SQL Editor 执行，或用迁移工具执行。

当前正式 migration 顺序记录在 `supabase/sql/README.md` 中，核心文件包括 profiles/settings、events core、event image storage、ticket_applications core、Ticket Management V2 字段、custom_venues、events.doors_open_time。`checks/` 下的 SQL 只用于检查字段和 RLS policies，不是 migration。

重要约束：

- `events` 保存参战记录和 venue snapshot。
- `ticket_applications` 保存票务抽选轮次，使用 `ticketGroupKey` 单表分组，没有 `ticket_groups` 表。
- `custom_venues` 保存用户自定义场馆库，并通过 RLS 限制用户只能操作自己的记录。
- Storage bucket 用于 event image 上传。
- `doors_open_time` 使用 `text`，是为了匹配已有的 `events.start_time text`。
- 执行 schema 变更后需要运行 `notify pgrst, 'reload schema';`，避免 PostgREST schema cache 没刷新。

#### 0.10 模块关系和数据流

核心数据流可以概括为：

```text
用户操作 UI
EventForm / TicketApplicationForm / CustomVenuesManager
  ↓
App state / handlers
  ↓
services
  ↓
Supabase cloud mode 或 localStorage local mode
  ↓
Timeline / Analytics / Backup / cards 从统一数据模型读取
```

VenueCombobox 从 built-in venues、customVenues 和 recent inferred venues 中选择场馆。Event 和 Ticket 不只保存 `venueId`，还保存 `venueName`、`city`、`country` 等 snapshot，因此 customVenue 被删除后历史记录仍能显示。TicketManager 用 `ticketGroupKey` 聚合同一场公演的多轮抽选。Backup 同时保存 customVenues 和 events/tickets 的 venue snapshots，既能恢复正式场馆库，也能保护历史记录显示。

### 1. 项目动机

StageLog JP 的出发点是解决一个比较具体的记录问题：日本演出、舞台活动、fan event 和票务抽选并不适合只用普通日历或备忘录管理。日历可以记录日期，但很难自然表达多轮抽选、申请张数、中选张数、付款张数、场馆、座位、天气、票务支出、图片、备份和长期分析。

项目目标不是做一次性的活动备忘录，而是做一个可以长期使用的个人参战档案和数据分析工具。因此，StageLog JP 把参战记录、票务抽选、场馆系统、自定义场馆、天气匹配、图片上传、备份导入导出和 Analytics 放在同一个产品中处理。

### 2. 初始参战记录

#### Goal

最初的目标是让 StageLog JP 能作为个人 live event archive 使用。核心流程是创建、编辑和管理参战记录，并保留足够多的上下文，方便以后回顾。

#### Problem

早期问题还没有扩展到票务抽选。用户首先需要的是结构化记录工具，而不是普通 notes。关键字段包括艺人、日期、场馆、座位、备注、图片和天气。

#### Design Decision

项目从 EventRecord 模型和 localStorage 持久化开始。这样应用可以先作为独立浏览器应用运行，不依赖登录和后端。内置 venues 数据提供城市、国家、经纬度等基础信息，也为后续 seat map 和 weather matching 留下空间。

#### Implementation

MVP 阶段实现了新增、编辑、删除、筛选和展示参战记录，ticket stub 风格的 event card，localStorage 持久化，sample event 加载，日本内置场馆数据，Open-Meteo Archive 天气查询，基础参战统计，以及 event image 处理。后续图片能力演进为 Supabase Storage 上传。

场馆和座位信息从早期就被纳入模型，因为它们对参战回忆非常重要。后续迭代又扩展了 venues 页面、SVG 缩略图和数据驱动的 seat map。

#### Initial Limitation

早期模型是 event-centric。它适合记录已经参加或计划参加的活动，但不适合记录还在抽票阶段的过程。它无法表示同一场公演的多轮抽选，也无法表达部分中选、付款状态、平台级当选率等票务分析需求。

#### Result

应用成为了可用的本地参战档案工具，也为后续 cloud sync、ticket applications、venue search、seat maps 和 analytics 打下了数据基础。

### 3. 云同步与 Supabase 集成

#### Goal

下一阶段目标是支持跨设备同步，同时保留无需登录也能使用的 local mode。

#### Problem

localStorage 对单一浏览器来说简单可靠，但不能跨设备同步，也容易受浏览器数据清理影响。如果直接强制所有数据进入云端，又会让登录变成必需，并提高早期使用门槛。

#### Design Decision

项目采用 cloud/local 双模式：登录用户通过 Supabase 使用 cloud mode，未登录用户继续使用 localStorage，本地数据可以导入云端，Supabase RLS 用于保护用户自己的数据行。这个设计避免了强制登录，同时让需要长期保存和跨设备同步的用户可以使用云端模式。

#### Implementation

Supabase 集成引入了 Supabase Auth、events 和 user_profiles 等用户数据表、RLS policies、cloud event CRUD、local event CRUD fallback、cloud/local 数据导入、用户资料保存，以及需要登录态的 Storage 图片上传。SQL migration 放在 supabase/sql/ 中，并在设置文档里说明需要运行 schema reload。

#### Debugging Notes

这个阶段遇到的主要问题来自 Auth、RLS 和 Supabase schema cache。保存失败如果只显示泛泛的错误提示，很难判断是缺字段、RLS policy、schema cache 还是登录态问题。因此后续错误处理改为保留 Supabase 的 message、details、hint 和 code。

#### Result

项目形成了目前的基础架构：cloud mode 给登录用户使用，local mode 给未登录和离线倾向用户使用，两种模式共享大部分 UI 和数据模型。

### 4. Profile、设置与认证问题

#### Goal

这一阶段主要让个人资料、主题、语言设置和认证流程更稳定。

#### Problem

Cloud mode 引入后，profile 和 settings 的保存链路也变复杂了。常见问题包括 Supabase Auth redirect URL 配置不正确、magic link 或 email login 回跳后 session 不稳定、RLS policy 或 schema cache 导致 profile 保存失败、错误提示过于模糊、cloud/local settings 状态容易不一致。

#### Design Decision

项目把用户资料和设置作为独立关注点处理，同时保持 local fallback。关键取舍是：认证失败或 profile 保存失败不能破坏本地使用，错误信息必须足够具体，方便定位 Supabase 配置问题。

#### Implementation

这一阶段完善了 profile 字段和保存逻辑、theme / language settings、cloud/local mode 下的设置保存、Supabase Auth redirect 文档、RLS 和 schema cache 相关排错说明，以及具体 Supabase 错误信息展示。

#### Result

登录、资料保存和设置切换变得更可排查。即使 cloud 配置出现问题，local mode 仍然可以继续使用。

### 5. 票务管理 V1

#### Goal

Event tracking 之后，项目开始支持票务抽选记录。V1 的目标是记录一条 ticket application 的基础信息。

#### Problem

日本演出和舞台活动常见多平台、多轮抽选。只记录 event 本身无法表达从哪个平台申请、抽选结果是什么、申请了几张、花了多少钱，以及哪些平台更容易中选。

#### Implementation

Ticket Management V1 引入了 ticket application 数据和表单，字段包括 event title、artist、performance date、venue、platform、status、quantity、amount 和 memo。

#### Initial Limitation

V1 的局限很快变明显：单一 quantity 无法区分申请张数、中选张数和付款张数；同一场公演多轮抽选只能记录成互不相关的多条数据；很难计算张数当选率和轮次当选率；默认 JPY 不符合中国用户按 CNY 复盘支出的习惯；group card 和新增下一轮流程尚不存在。

#### Result

V1 验证了票务管理的需求，但也说明必须重构 ticket model，才能真实表达日本票务抽选流程。

### 6. 票务管理 V2：多轮抽选分组

#### Goal

Ticket Management V2 的目标是正确表达同一场公演下的多轮抽选，并支持更准确的数量、金额和当选率分析。

#### Problem

V1 无法自然表示多轮抽选。用户可能先参加 fan club 先行，之后参加 official 先行、一般贩售或多个平台抽选。它们属于同一场公演，但每一轮有自己的平台、状态、张数、金额和备注。

#### Design Decision

项目选择使用 ticketGroupKey 做单表分组，而不是新增 ticket_groups 表。每一轮抽选仍然是 ticket_applications 表中的一条记录，同一场公演的多轮记录共享同一个 ticketGroupKey。这样可以降低迁移复杂度，保持旧数据和 backup/import 流程更容易兼容，同时让 group-level UI 从单表数据计算出来。

#### Implementation

V2 引入 ticketGroupKey、roundName、roundType、appliedQuantity、wonQuantity、paidQuantity、currency、displayCurrency、amountOriginal、amountDisplay、手动汇率 / 手动折算、默认展示货币 CNY、group card、round list、新增这一场的抽选轮次、保存并新增下一轮。

数量模型从单一 quantity 拆分为 appliedQuantity、wonQuantity 和 paidQuantity。这让系统可以计算张数维度当选率、轮次维度当选率、公演维度获得率，以及平台维度支出和当选率。

#### Currency Decision

项目默认使用 CNY 作为展示货币，但不做自动换汇。原因是这个工具面向个人记录，用户可能希望手动输入实际支付时的折算金额，而不是依赖外部汇率 API。系统保留原始金额和展示金额，汇率由用户手动输入或手动计算。

#### Bugs / Debugging Notes

V2 的关键风险是不能破坏现有 Ticket Management 流程：新增第一轮、编辑某一轮、删除某一轮、group card 展示、新增下一轮继承公演信息、保存并新增下一轮时只重置 round-specific 字段，以及 cloud/local mode 和 backup 都必须保留 ticketGroupKey。

#### Result

Ticket Management V2 让 StageLog JP 能真实表达日本票务抽选流程。它避免新增 ticket_groups 表，但通过 ticketGroupKey 支持了多轮分组、group summary 和 ticket analytics。

### 7. 表单持久化与浏览器生命周期问题

#### Goal

这一阶段解决 EventForm 和 TicketForm 在浏览器切换、移动端后台和页面生命周期变化中丢失输入的问题。

#### Problem

实际使用中，用户可能在填写长表单时切到其它页面、切换浏览器 tab、手机进入后台，回来后表单变空白。这类问题对参战记录和票务记录尤其严重，因为表单字段很多，重新输入成本高。

#### Design Decision

项目引入 draft/session 机制，将表单状态在 visibilitychange、pagehide、beforeunload、component unmount 和手动关闭表单等关键生命周期节点保存到 localStorage。同时区分 new draft 和 edit draft，避免新增表单草稿污染编辑表单。

#### Implementation

实现包括 EventForm draft、TicketForm draft、new/edit draft key 分离、保存成功后清理 draft、加载表单时恢复 draft、防止空白初始值覆盖有效草稿，以及保存并新增下一轮时保留公演级字段，只重置轮次级字段。

#### Bugs / Debugging Notes

这个阶段的主要 bug 是保存太晚和恢复时机不对。如果只依赖 unmount，移动端后台或浏览器生命周期变化时可能无法可靠触发。加入 visibilitychange、pagehide 和 beforeunload 后，可靠性更好。另一个问题是 edit form 和 new form 的 draft 混用，通过 draft key 分离解决。

#### Result

EventForm 和 TicketForm 在切换页面、切换 tab、手机后台后不再容易变空白。Ticket V2 的新增下一轮流程也能保留必要上下文。

### 8. Analytics V1 与 Recharts 渲染修复

#### Goal

Analytics V1 的目标是把参战记录转换为可读的统计图表，包括年度参战、月度趋势、艺人分布、场馆分布和地区分布。

#### Problem

项目遇到过一个关键 UI bug：数据存在，fallback list 能显示，但 Recharts 主图空白，或者只显示 legend。排查后确认不是 Supabase 数据问题，不是 dataKey 问题，也不是 analyticsUtils 生成的数据为空；问题来自 Recharts ResponsiveContainer 在 grid/card 布局中测量宽度不稳定。

#### Design Decision

项目决定移除 ResponsiveContainer，改用自定义 ChartFrame + ResizeObserver。这个决策被明确保留为后续约束：不要重新引入 ResponsiveContainer。

#### Implementation

修复方式包括新增 ChartFrame，使用 ResizeObserver 测量容器宽度，给 BarChart / LineChart 等显式传入 width 和 height，保留 fallback list，关闭动画以减少渲染不稳定，对柱状图增加 minPointSize，对折线图保留 dot，避免小数据集看起来空白。

#### Bugs / Debugging Notes

这个 bug 的迷惑点在于：数据和 fallback 都正常，只有主图空白。最终定位到 layout measurement，而不是数据层。这个经验影响了后续 Analytics V2 的实现方式。

#### Result

Analytics 图表在 desktop 和 mobile 下更稳定。ChartFrame + ResizeObserver 成为项目的图表渲染基础。

### 9. Analytics V2：天气与票务分析

#### Goal

Analytics V2 扩展了分析范围，从参战统计扩展到天气和票务。

#### Weather Analytics

天气分析包括天气状态分布、月度平均气温、月度降水量、风速排行、最热、最冷、雨量最大、风最大记录、空数据状态和 fallback list。这些分析依赖 event 中保存的 weather snapshot。自定义场馆如果没有经纬度，就无法自动获取天气。

#### Ticket Analytics

票务分析包括票务状态分布、平台分布、各平台当选率、月度票务支出、累计票务支出、各平台支出、各平台平均票价，以及 Ticket V2 group/round 数据分析。

#### Design Decision

票务统计改用 V2 字段：appliedQuantity、wonQuantity、paidQuantity、amountDisplay、displayCurrency。支出分析不硬编码 JPY，而是使用 display currency。默认展示为 CNY，自动换汇不在当前范围内。

#### Result

Analytics V2 让项目从记录工具进一步变成复盘工具。用户可以看到参战趋势、天气影响、平台表现和票务支出。

### 10. 备份导入 / 导出

#### Goal

Backup 的目标是让用户可以导出完整数据，并在 local/cloud mode 之间迁移或恢复。

#### Problem

随着数据模型扩展，backup 不能只保存 events。它还必须保留 Ticket V2 字段、profile/settings、自定义场馆和 venue snapshots。否则导入后可能丢失分组、票务金额、自定义场馆或历史记录展示信息。

#### Design Decision

Backup 设计同时保留独立数据集合，例如 events、ticketApplications、customVenues，也保留 event/ticket 上的 snapshot 字段，例如 venueId、venueName、city、country，以及 Ticket V2 的 group 和 round 字段。这意味着即使 custom venue library 变化，历史 event/ticket 仍然有自己的场馆快照。

#### Implementation

Backup 支持 JSON export、JSON import、events、ticketApplications、profile、settings、customVenues、旧 backup 兼容、cloud import 使用当前 user id、local import 写入 localStorage、保留 ticketGroupKey、保留 custom: venueId、保留 venue snapshots。

#### Bugs / Debugging Notes

Cloud import 不能强行写入 backup 文件里的旧 user uuid。导入 customVenues 时也不能把 custom: venueId 当作 Supabase uuid。旧 backup 没有 customVenues 字段时必须正常导入。

#### Result

Backup 成为 cloud/local 双模式下的安全网。它既支持迁移，也降低了误删或 schema 迭代带来的风险。

### 11. Venue UX A：可搜索场馆与临时自定义场馆

#### Goal

Venue UX A 的目标是改善原始 venue select 难用和内置场馆覆盖不足的问题。

#### Problem

日本演出场馆非常分散。内置 venues 可以覆盖 dome、arena、hall 等常见场馆，但很难覆盖所有 livehouse、小剧场、咖啡厅、临时活动场地和 fan event 场地。普通下拉 select 也不适合在大量场馆中查找。

#### Design Decision

A 方案刻意不新增数据库表。自定义场馆只跟随 event/ticket 保存，并从已保存 records 中推断 recent custom venues。这个设计不需要新增 Supabase schema，不需要新增 RLS，不影响现有 cloud/local 数据，并且可以快速解决场馆不在内置列表里的实际问题。

#### Implementation

Venue UX A 引入 venueSearchUtils、VenueCombobox、英文名 / 日文名 / 中文名搜索、aliases 搜索、city / prefecture / region / country / category 搜索、自定义场馆 inline form、custom: slug venueId、从 events / ticketApplications 推断历史自定义场馆、EventForm 接入、TicketApplicationForm 接入、seat map fallback 和 weather coordinate limitation 提示。

#### Bugs / Debugging Notes

关键兼容点包括：自定义场馆不能让 seat map 崩溃；只有支持的内置场馆显示内置 seat map；自定义场馆没有经纬度时不能无提示地获取天气；ticketGroupKey 不能因为 venueId 不在内置 venues 中而为空；新增下一轮必须继承 custom venue 信息。

#### Result

用户可以搜索内置场馆，也可以临时输入自定义场馆。历史自定义场馆可以从已保存记录中再次出现，形成轻量候选。

#### Limitation

A 方案没有独立自定义场馆库。未保存到 event/ticket 的临时输入不会同步，也不适合集中维护别名、经纬度、容量或备注。

### 12. Custom Venues B-lite：自定义场馆库

#### Goal

B-lite 的目标是在不做完整复杂场馆系统的前提下，提供用户自己的正式自定义场馆库。

#### Why Upgrade from A

Venue UX A 已经解决了临时输入场馆的问题，但仍有不足：用户不能主动维护自定义场馆，自定义场馆无法跨设备同步，aliases、经纬度、备注无法集中维护，已保存记录里的历史推断候选和正式场馆库概念不清晰。

#### Design Decision

B-lite 新增 custom_venues 表，但不修改 events / ticket_applications schema，也不新增 ticket_groups 表。关键取舍是：custom_venues 是用户自己的自定义场馆库；events/tickets 仍保存 venueName / city / country 快照；删除 customVenue 不会批量更新历史 records；VenueCombobox 合并三种来源；不做场馆合并、不做自定义场馆座位图、不做自动 geocoding、不做删除后的复杂联动。

#### Implementation

B-lite 分阶段实现。Foundation 阶段新增 supabase/sql/05_custom_venues.sql、CustomVenue 类型、customVenueService、localStorage fallback key stagelog-custom-venues，以及 Backup 类型基础支持 customVenues。App integration 阶段加入 App-level customVenues state、cloud/local mode 加载、create/update/delete handlers、VenueCombobox 支持正式 customVenues、EventForm / TicketApplicationForm 可以选择和创建 customVenue、Backup export/import 接入 customVenues。Management UI 阶段加入 CustomVenuesManager，支持新增、编辑、删除、搜索、event/ticket usage count、删除确认、cloud/local CRUD 和移动端布局优化。

#### Supabase and RLS

custom_venues 表使用 text id，前端统一使用 custom: uuid 风格。表包含 user_id、name、name_ja、name_zh、aliases、city、country、prefecture、region、latitude、longitude、category、capacity、notes、created_at 和 updated_at。RLS policies 限制用户只能 select / insert / update / delete 自己的 custom venues。

#### VenueCombobox Source Order

VenueCombobox 的搜索结果顺序是 built-in venues、official customVenues、recent inferred venues。这样既保留内置场馆优先级，也让正式自定义场馆和历史推断场馆可以共存。

#### Venue Snapshot Decision

Event 和 ticket 仍保存 venueId、venueName、city、country。这个 snapshot 设计保证即使 customVenue 被删除，历史记录仍然能显示场馆名称和城市，不会变成空白。

#### Result

B-lite 给 StageLog JP 增加了一个可维护、可同步、可备份的自定义场馆库，同时避免过早进入完整 venue CRM 的复杂度。

### 13. 移动端体验与导航优化

#### Goal

移动端优化的目标是让 EventForm、TicketForm、VenueCombobox、CustomVenuesManager 和 Analytics 在手机上可用。

#### Problem

随着功能增加，移动端风险也增加：bottom nav 可能遮挡最后内容；Ticket group card 容易横向溢出；VenueCombobox 候选列表可能超出屏幕；custom venue inline form 字段较多；Analytics 图表可能横向溢出；header 高度可能占用过多空间。

#### Implementation

移动端 polish 包括 bottom padding、单列 form layout、避免候选列表横向溢出、card 内容换行、长 venue name / aliases / notes 防止撑爆、操作按钮保持可点击、Analytics chart container 响应式、header 和 bottom nav 协调。

#### Result

核心 workflows 在手机端更稳定，尤其是 ticket group、venue search 和 custom venue management。

### 14. 回归测试与验证

#### Goal

随着模块增多，项目需要系统化验证，避免某一阶段改动破坏已有功能。

#### Verification Scope

验证覆盖 npm install、npm run build、TypeScript build、Vite chunk size warning、Supabase SQL、RLS policies、Auth redirect、cloud/local mode、EventForm、TicketForm、VenueCombobox、CustomVenuesManager、Backup、Analytics、mobile layout 和 i18n。

#### Build Notes

项目 build 可以通过，但 Vite 可能提示大 chunk warning。这是已知 warning，不等同于 TypeScript error。未来可以通过 route-level lazy loading 或 manual chunks 优化。

#### Result

VERIFICATION.md 成为回归检查清单，记录哪些能力需要自动或手动验证，尤其是 Supabase SQL、RLS、cloud/local mode 和 custom venues。

### 15. 当前架构总结

当前 StageLog JP 架构包括 React + Vite + TypeScript、Supabase Auth、Supabase Database + RLS、Supabase Storage for event images、localStorage fallback、built-in venues、custom_venues、events、ticket_applications、analyticsUtils、backupService、ChartFrame + ResizeObserver、VenueCombobox 和 CustomVenuesManager。

核心数据流是：events 和 tickets 保存自己的 venue snapshots；built-in venues 提供标准场馆信息；customVenues 提供用户自己的场馆库；VenueCombobox 合并 built-in、customVenues 和 recent inferred venues；backup 同时保留 customVenues 和 record snapshots；analytics 从 events / ticketApplications 派生统计结果。

### 16. 已知限制

当前已知限制包括：不支持自动汇率 API；不支持自动 geocoding；不支持自定义场馆座位图；删除 customVenue 不会批量更新历史 records；暂不支持 custom venue merge / dedup；customVenue 删除后，历史 records 依赖 venue snapshot；大 bundle 可能出现 Vite chunk size warning；cloud mode 依赖 Supabase SQL migration 和 RLS 配置正确；custom venue weather 依赖经纬度。

这些限制是有意保留的范围控制，不应在没有明确设计前通过大范围重构解决。

### 17. 未来改进方向

可能的后续方向包括 Toast / Snackbar system、更好的搜索和筛选、最近艺人 / 平台建议、custom venue merge / dedup、可选的历史 records 批量更新、custom venue seat map support、map picker / geocoding、更好的 bundle splitting、更多自动化测试。

这些方向目前都不是已完成功能。它们适合作为后续规划，而不是当前 README 或产品描述里的已实现能力。

### 18. 个人复盘备注

这个项目的主要难点不是页面数量，而是真实使用流程背后的数据模型。Ticket Management V2、Recharts 渲染修复、Venue UX A 到 Custom Venues B-lite 的演进，是最关键的几轮迭代。

目前不应该继续无限加功能。更合理的下一步是持续真实使用、补回归测试、完善错误提示，并观察哪些流程确实需要进一步产品化。

### 19. 暂时不做的内容

短期内不应继续扩大的方向包括：完整 B：场馆合并 / 去重；自定义场馆座位图；自动 geocoding；删除 customVenue 后批量更新历史 records；自动汇率 API；大规模重写 Ticket Management V2；重新引入 ResponsiveContainer。

### 20. 开发日志初版之后的近期迭代

这一节补充 DEVELOPMENT_LOG 初版创建之后的几个小阶段。它们不是独立大模块重写，而是围绕真实使用流程做的字段补充、UX polish、SQL 维护和 bugfix。

#### 20.1 Ticket 编辑与票务转参战 UX

**Problem**：Ticket Management V2 已经支持“新增这一场的抽选轮次”和“保存并新增下一轮”，但编辑某一轮 ticket 时，页面没有像新增流程一样自动滚动到 TicketApplicationForm。另一个问题是从 ticket round 点击“创建参战记录”后，用户可能停留在票务页面或没有进入可继续编辑的 EventForm。

**Design Decision**：这些问题属于导航和表单定位，不应该改 Ticket V2 数据模型。解决方式是复用已有 form ref、scroll helper、focus request 和 session 机制。

**Implementation**：编辑 ticket round 时，表单切换到 edit mode 后自动滚动到 TicketApplicationForm，并优先聚焦 roundName。票务创建参战记录流程改为切换到 EventForm 新增模式，使用 ticket preset 预填 title、artist、date、venue snapshot、seat/notes 等信息，滚动到 EventForm，并避免对已有 linkedEventId 的 ticket 重复创建 event。

**Result**：Ticket group card 中新增、编辑、保存并新增下一轮、从 ticket 创建 event 的体验更连续，同时没有改变 ticket_applications schema，也没有新增 ticket_groups 表。

#### 20.2 Event Time Model：开场时间与开演时间

**Problem**：EventForm 原来只有 `startTime`，但日本演出记录中“开场时间 / doors open”和“开演时间 / show start”经常都需要记录。只记录 startTime 会丢失实际入场和安排行程需要的信息。

**Design Decision**：新增 `doorsOpenTime` 作为 EventRecord 字段，并在 Supabase 中加入 `events.doors_open_time`。关键约束是：`doors_open_time` 必须使用 `text`，因为现有 `events.start_time` 也是 `text`。不使用 `time` 或 `timestamptz`，避免 cloud/local 数据格式不一致，也避免破坏已有 start_time。

**Implementation**：新增 `supabase/sql/07_events_doors_open_time.sql`，确保 `doors_open_time text` 存在，并能把误建成 time-like 类型的字段转换回 text。EventForm 在日期和开演时间之间增加开场时间输入；EventRecord / EventFormValues / cloud mapping / local storage / backup import-export 都兼容 `doorsOpenTime`。显示层通过时间 helper 把 `16:00:00` 归一化成 `16:00`。

**Result**：参战记录可以同时显示“开场 15:00 / 开演 16:00”或对应英文 “Doors 15:00 / Start 16:00”。旧记录没有 doorsOpenTime 时继续正常显示。

#### 20.3 Supabase SQL 文件结构整理

**Problem**：随着 events、ticket_applications、custom_venues、storage、schema compatibility 和检查语句增多，`supabase/sql` 目录开始难以维护。旧文件名也不再准确表达运行顺序和职责。

**Design Decision**：不把已执行的 migration 合并成一个大文件，也不修改业务 schema 逻辑。只做文件命名、拆分、README 和检查脚本归档，让未来维护者能明确哪些是 migration、哪些是检查脚本。

**Implementation**：`supabase/sql` 现在按推荐顺序组织为 profiles/settings、events core、event images storage、ticket_applications core、Ticket V2、custom_venues、doors_open_time。`checks/` 目录保存 events、ticket_applications、custom_venues columns 和 RLS policies 的只读检查脚本。`supabase/sql/README.md` 记录用途、运行顺序、每个 migration 的职责、检查脚本说明、manual verification queries，以及执行 schema 变更后需要 `notify pgrst, 'reload schema';`。

**Result**：SQL 目录从“补丁集合”变成可读的 migration 记录。需要强调的是：把 SQL 文件 push 到 GitHub 不会自动修改 Supabase 数据库，仍然需要手动在 Supabase SQL Editor 执行或通过迁移工具执行。

#### 20.4 Custom Venue Coordinates and Weather

**Problem**：Custom Venues B-lite 支持在 custom_venues 中维护 latitude / longitude，但天气获取逻辑早期主要从内置 venues 查坐标。结果是自定义场馆即使填写了坐标，也可能被误判为没有坐标。

**Design Decision**：天气 API 不应该负责理解 built-in venues、customVenues 和历史推断场馆。坐标解析应该在前端工具层统一完成，再把解析出的经纬度传给 weatherService。

**Implementation**：`venueSearchUtils` 增加统一坐标解析逻辑，优先级是：当前 event/form snapshot 的 latitude / longitude、built-in venues id、customVenues id、customVenues name + city、recent inferred venues。解析支持 number 和 string，经纬度范围校验为 latitude -90 到 90、longitude -180 到 180，并且不会把合法的 0 当成无效值。Event weather fetch 和 event card 的按钮禁用逻辑都改为使用这个解析结果。

**Result**：有坐标的 customVenue 可以获取天气；没有坐标或坐标无效时显示更准确的提示：“当前场馆缺少经纬度，无法自动获取天气。请在自定义场馆中补充 latitude / longitude。”这不是自动 geocoding，坐标仍需要用户手动维护。

#### 20.5 Custom Venue 坐标同步到 EventForm

**Problem**：用户在 CustomVenuesManager 编辑 customVenue 的 latitude / longitude 后，再去新增参战记录选择这个 customVenue，EventForm 有时仍像没有坐标。这类问题不是 schema 问题，而是前端状态链路问题：custom venue library、VenueCombobox、EventForm state 和 weather resolver 之间必须保持坐标一致。

**Design Decision**：不重写 EventForm / VenueCombobox / CustomVenuesManager，只补齐坐标链路。正式 customVenue 的坐标应当在 create/update 后立即进入 App customVenues state；VenueCombobox 选择 customVenue 时返回坐标；EventForm 如果当前已选 customVenue 但 state 缺坐标，应从 customVenues state 补齐。

**Implementation**：customVenueService 对 latitude / longitude 做范围清洗，CustomVenuesManager 和 VenueCombobox 在保存/inline 创建时对超范围坐标给出明确错误，不再静默丢失。EventForm 增加一个保守的同步 effect：只在当前选中正式 customVenue 且表单缺少坐标时，从 App 传入的 customVenues 中补齐 latitude / longitude，不覆盖已有 event snapshot。

**Result**：在“我的自定义场馆”中维护坐标后，新建 event 选择该 customVenue 会立即获得坐标；在 EventForm 中直接创建 customVenue 并填写坐标也能立即进入表单 state。已有 event 如果没有坐标 snapshot，也仍可通过 customVenues id 查到坐标并获取天气。

#### 20.6 Timeline UI V1 Polish

**Problem**：Timeline 页面已经能展示 event，但视觉上更像普通列表。年份、日期和事件之间的关联不够强，开场 / 开演 / 天气信息挤在一行，可读性一般。

**Design Decision**：这属于 Timeline UI V1 polish，不改变数据排序、分组或 schema。不新增筛选、日历视图、月份折叠，也不重写 Timeline。

**Implementation**：Timeline 保留现有年份分组和 `sortByDateDesc`，但把展示改成更接近时间线：年份 header 更明显，event 左侧有日期列、节点圆点和竖向连接线，右侧是 timeline-specific card。开场、开演和天气变成 badge；未来活动和已完成活动用 UI-only 状态 badge 显示 Upcoming / Completed 或 予定 / 已完成。移动端改为单列/弱化节点，避免横向溢出。

**Result**：Timeline 更像时间线而不是普通列表，同时不影响 EventForm、Ticket Management V2、Analytics、Backup 或 Supabase schema。

---

## English Version

This document summarizes the StageLog JP development process by product and engineering phases. It is based on the repository commit history, README, verification notes, Supabase setup notes, and the current project structure.

### 0. Project Structure Guide

```text
StageLog-JP/
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── i18n/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── public/
│   ├── venue-maps/
│   └── venue-thumbnails/
├── scripts/
│   └── generateVenueThumbnails.mjs
├── supabase/
│   └── sql/
│       ├── checks/
│       ├── README.md
│       ├── 01_profiles_and_user_settings.sql
│       ├── 02_events_core.sql
│       ├── 03_event_images_storage.sql
│       ├── 04_ticket_applications_core.sql
│       ├── 05_ticket_model_v2.sql
│       ├── 06_custom_venues.sql
│       └── 07_events_doors_open_time.sql
├── README.md
├── README.zh-CN.md
├── DEVELOPMENT_LOG.md
├── VERIFICATION.md
├── SUPABASE_SETUP.md
├── package.json
├── package-lock.json
├── vite.config.ts
└── tsconfig.json
```

This section explains how the main folders and files in StageLog JP relate to each other. It is not meant to be a complete file tree; it focuses on responsibilities, boundaries, and data flow.

#### 0.1 Top-Level Structure

- `README.md`: project overview, local setup, and Supabase setup entry point for GitHub readers and future maintainers.
- `README.zh-CN.md`: Chinese README entry point for Chinese readers.
- `DEVELOPMENT_LOG.md`: development retrospective covering product phases, technical decisions, major bugs, architecture evolution, and limitations.
- `VERIFICATION.md`: build, regression, and manual verification notes for cloud/local mode, Supabase SQL, RLS, forms, tickets, Analytics, Backup, and mobile layout.
- `SUPABASE_SETUP.md`: Supabase configuration notes for Auth, environment variables, SQL, Storage, and cloud sync.
- `package.json` / `package-lock.json`: dependencies and scripts. The main scripts are `dev`, `build`, `preview`, `typecheck`, and the venue thumbnail generator.
- `vite.config.ts`: Vite build configuration.
- `tsconfig.json`: TypeScript compiler configuration.
- `scripts/`: helper scripts, currently including the venue thumbnail generator.
- `public/`: static assets such as venue maps and venue thumbnails.
- `supabase/sql/`: Supabase schema migrations and read-only check scripts.
- `src/`: main React + TypeScript application code.

#### 0.2 `src` Directory

`src` is the React + TypeScript frontend application. It contains the application bootstrap, the global coordination layer, business components, data services, type definitions, utility functions, static data, and i18n resources. The core relationship is: `main.tsx` mounts the app, `App.tsx` coordinates global state and workflows, `components` render UI and collect user input, `services` handle cloud/local persistence, and `types` / `utils` keep data models and pure logic separate.

##### `main.tsx`

`main.tsx` is the React bootstrap entry. It finds the DOM `root`, mounts `App`, and wires the lightweight startup layer: `StrictMode`, `AuthProvider`, `UserSettingsProvider`, i18n initialization, and the global stylesheet.

Its responsibility should stay small: start React, attach global providers, and load global resources. It should not contain events, tickets, Supabase CRUD, backup, or weather business logic.

##### `App.tsx`

`App.tsx` is the current application coordination layer, not just a normal UI component. It connects view state, user state, business data, and service calls across modules.

It coordinates:

- view/tab switching for events, timeline, venues, statistics, analytics, tickets, and new-event flows,
- cloud mode / local mode state,
- Supabase Auth user state and local-mode state,
- events state: loading, create, edit, delete, import, weather updates, and image updates,
- ticketApplications state: loading, create, edit, delete, and `ticketGroupKey` grouping workflows,
- customVenues state: loading, create, edit, delete, and passing custom venues into `VenueCombobox`, `EventForm`, and `TicketApplicationForm`,
- profile / settings state such as profile data, language, theme, and display settings,
- backup import/export by passing events, tickets, profile/settings, and customVenues into `BackupPanel` / `backupService`,
- form presets and navigation, such as create-event-from-ticket, ticket round edit scrolling, and EventForm / TicketForm new/edit state,
- weather fetch coordination across event/form coordinates, built-in venues, customVenues, and `weatherService`,
- image upload coordination between `EventForm`, `storageService`, event `image_path`, and `imageUrl`,
- draft/session behavior for `EventForm` and `TicketApplicationForm` across refresh, tab switching, and mobile backgrounding,
- writing service return values back into shared React state.

The typical data flow is:

```text
UI component action
  ↓
App.tsx handler
  ↓
Supabase service or localStorage fallback, depending on cloud/local mode
  ↓
Returned record is written back into shared state
  ↓
Timeline / Cards / Analytics / Backup re-render from that state
```

`App.tsx` is heavy because the app evolved as a single-page application with many cross-module workflows. Keeping this coordination in one place makes Event, Ticket, Venue, Backup, Weather, and Auth interactions easier to reason about. If the app grows further, optional refactoring targets include `useEventsController`, `useTicketsController`, `useCustomVenuesController`, `useBackupController`, `useWeatherController`, and a route/view state controller. Those controllers are future options, not current implemented modules.

##### `index.css`

`index.css` is the global styling entry. Because the project currently does not use CSS modules or Tailwind, much of the theme, responsive layout, and component-level styling lives here.

It covers:

- base styles for colors, backgrounds, typography, buttons, forms, cards, and badges,
- Sakura / Ocean / Night / Classic theme styles,
- mobile header, bottom navigation, drawer, floating add button, and other responsive layout rules,
- component styling for Timeline, ticket group cards, VenueCombobox, CustomVenuesManager, and Analytics chart frames,
- mobile usability details such as long-text wrapping, form bottom padding, scrollable candidate lists, and chart container width constraints.

This centralized style approach made fast iteration and consistent visual polish easier. If styles continue to grow, component-level CSS splitting may become useful, but the current centralized stylesheet still fits the existing single-page application structure.

#### 0.3 `src/components`

`components` contains reusable UI and business components:

- `EventForm`: create/edit event records, including doors open time, show start time, VenueCombobox, seat data, image upload, draft/session behavior, and save handling.
- `TicketApplicationForm`: create/edit ticket lottery rounds, including Ticket Management V2 fields, quantity validation, currency fields, round presets, and draft/session behavior.
- `TicketManager`: renders ticket group cards, groups rounds by `ticketGroupKey`, and handles add-round, edit-round, delete-round, and create-event-from-ticket entry points.
- `VenueCombobox`: the unified venue selector. It merges built-in venues, saved `customVenues`, and recent inferred venues, and supports inline custom venue creation.
- `CustomVenuesManager`: user-owned custom venue library UI for create, edit, delete, search, and event/ticket usage counts.
- `BackupPanel`: JSON backup export/import UI.
- `Analytics` and `ChartFrame`: analytics dashboards and stable Recharts rendering. Charts use ChartFrame + ResizeObserver instead of ResponsiveContainer.
- `Timeline`: chronological event display. Later iterations added a date column, nodes, connector lines, time badges, weather badges, and upcoming/completed status badges.
- `TicketCard` / `EventList`: event card and list display, including weather fetch entry points, images, seat summary, and edit/delete actions.
- `Header`, `MobileBottomNav`, `MobileMenuDrawer`, `FloatingAddButton`: desktop and mobile navigation.

#### 0.4 `src/services`

`services` is the data access and external API layer. UI components should not hand-build Supabase rows; App handlers and services handle mapping and persistence.

- `cloudEventService`: Supabase row mapping and cloud CRUD for `events`, including `start_time`, `doors_open_time`, venue snapshots, seat/weather JSON, and image fields.
- `cloudTicketService`: Supabase row mapping and cloud CRUD for `ticket_applications`, including Ticket Management V2 fields and `ticketGroupKey`.
- `customVenueService`: cloud/local CRUD for `custom_venues`, localStorage fallback key `stagelog-custom-venues`, and cleaning for latitude / longitude / capacity.
- `eventStorage` / `ticketStorage`: localStorage fallback for events and ticket applications.
- `backupService`: JSON backup import/export, old backup compatibility, customVenues compatibility, and event/ticket venue snapshot preservation.
- `storageService`: event image upload, signed URL generation, and delete behavior through Supabase Storage.
- `weatherService`: Open-Meteo Archive fetch logic. Venue coordinates are resolved before calling this service.
- `profileService`, `draftStorage`: profile/settings persistence and form draft/session persistence.

#### 0.5 `src/types`

`types` defines the core data models:

- `EventRecord` / `EventFormValues`: event records, including `doorsOpenTime`, `startTime`, venue snapshots, seat, weather, image, and notes.
- `TicketApplication`: ticket lottery rounds, including `ticketGroupKey`, roundName / roundType, appliedQuantity / wonQuantity / paidQuantity, currency / displayCurrency, amountOriginal / amountDisplay, and related V2 fields.
- `CustomVenue`: user-owned custom venue library records, including aliases, location, coordinates, category, capacity, and notes.
- Backup types: JSON backup shape for events, ticketApplications, profile/settings, and customVenues.
- `Venue`: built-in venue data including coordinates, region, category, capacity, seat map support, and thumbnails.

#### 0.6 `src/utils`

`utils` contains pure helper functions:

- `ticketUtils`: `ticketGroupKey` generation/normalization, ticket quantity helpers, amount helpers, and grouping-related calculations.
- `analyticsUtils`: transforms events and tickets into chart-ready data for Analytics V1/V2.
- `venueSearchUtils`: venue search, search text normalization, historical custom venue extraction, custom venue id generation, and custom venue weather coordinate resolution.
- `dateUtils`: date/time formatting, doors/start display helpers, and date sorting.
- `seatMapUtils`: built-in seat map lookup and seat map compatibility helpers.
- `statisticsUtils`, `weatherUtils`: statistics and weather display helpers.

#### 0.7 `src/data`

`data` stores static data:

- `venues.ts`: built-in Japanese live venue data, including localized names, aliases, city, region, coordinates, category, capacity, seat map support, and thumbnail metadata.
- `seatMaps.ts`: data-driven seat map definitions for supported built-in venues.
- `sampleEvents.ts`: sample event records used for empty-state onboarding and local verification.

#### 0.8 `src/i18n`, `src/context`, and `src/lib`

- `src/i18n`: i18next resources and initialization for Chinese and English UI text. VenueCombobox, CustomVenuesManager, Ticket V2, Timeline, Backup, weather, seat map, and Analytics text live here.
- `src/context`: Auth and user settings contexts for Supabase session state, user settings, theme/language, and cloud/local mode behavior.
- `src/lib/supabase.ts`: Supabase client initialization from Vite environment variables. The frontend uses the anon/publishable key, not a service role key.

#### 0.9 `supabase/sql`

`supabase/sql` records database schema and migration scripts. Pushing SQL files to GitHub does not automatically modify the Supabase database. They must be run manually in the Supabase SQL Editor or through a migration tool.

The current recommended migration order is documented in `supabase/sql/README.md`. The files cover profiles/settings, events core, event image storage, ticket applications core, Ticket Management V2 fields, `custom_venues`, and `events.doors_open_time`. Scripts under `checks/` are read-only verification queries, not migrations.

Important constraints:

- `events` stores event records and venue snapshots.
- `ticket_applications` stores ticket lottery rounds and uses `ticketGroupKey` single-table grouping. There is no `ticket_groups` table.
- `custom_venues` stores the user-owned custom venue library, protected by RLS.
- Storage is used for event image uploads.
- `doors_open_time` is `text` to match the existing `events.start_time text` field.
- After schema changes, `notify pgrst, 'reload schema';` should be run so PostgREST sees new columns.

#### 0.10 Module Relationships and Data Flow

The main data flow is:

```text
User actions in UI
EventForm / TicketApplicationForm / CustomVenuesManager
  ↓
App state / handlers
  ↓
services
  ↓
Supabase cloud mode or localStorage local mode
  ↓
Timeline / Analytics / Backup / cards read from the shared data models
```

VenueCombobox selects from built-in venues, customVenues, and recent inferred venues. Events and tickets store `venueId` plus `venueName`, `city`, and `country` snapshots, so historical records still display even if a customVenue is deleted. TicketManager groups multiple lottery rounds with `ticketGroupKey`. Backup stores both customVenues and event/ticket venue snapshots, preserving both the custom venue library and historical display safety.

### 1. Project Motivation

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

### 2. Initial Event Tracking

#### Goal

The first milestone was to make StageLog JP useful as a personal live event archive. The core user flow was recording an attended or planned event with enough context to make the record meaningful later.

#### Problem

The initial problem was narrower than ticket lottery management: users needed a structured record for live events instead of a generic note. Key information included artist, date, venue, seat, notes, image, and weather context.

#### Design Decision

The project started with an `EventRecord` model and local persistence. This allowed the app to work as a standalone browser app before cloud sync was introduced. Built-in venue data provided useful defaults for city, country, coordinates, and later seat-map support.

#### Implementation

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

#### Initial Limitation

The early model was event-centric. It worked for recording events that were planned or already attended, but it did not model the ticket lottery process before an event was secured. It could not represent several application rounds for the same performance, partial wins, payment status, or platform-level win-rate analytics.

#### Result

The app became a usable local event archive and established the data foundation for later cloud sync, ticket applications, venue search, seat maps, and analytics.

### 3. Cloud Sync and Supabase Integration

#### Goal

The next major goal was cross-device persistence while preserving an offline-friendly local mode.

#### Problem

LocalStorage is simple and reliable for a single browser, but it cannot sync data across devices or survive browser data loss. Moving everything to the cloud immediately would make login mandatory and would complicate local-first usage.

#### Design Decision

The app adopted a dual-mode architecture:

- logged-in users use cloud mode through Supabase,
- guest users continue using localStorage,
- local data can be imported into the cloud,
- Supabase RLS protects user-owned rows.

This avoided forcing authentication for basic use while still allowing durable cloud sync for users who opt in.

#### Implementation

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

#### Result

StageLog JP can run fully in local mode or sync through Supabase when authenticated. User data is isolated by RLS, and the app keeps clear cloud/local boundaries.

### 4. Profile, Settings, and Authentication Issues

#### Goal

After adding Supabase, the project needed account-level polish: profile persistence, theme/language settings, and more resilient authentication UX.

#### Problem

Several integration issues appeared around Supabase:

- Auth redirect URLs needed to match deployment and local development URLs.
- Magic Link testing could run into email rate limits, requiring Email + Password support.
- Profile save failures could be hard to diagnose when errors were generic.
- Schema cache or RLS mismatches could cause saves to fail even when frontend state looked valid.

#### Design Decision

The app kept auth controls compact in the header and made error handling more explicit. Instead of hiding Supabase details behind a generic "save failed" message, service layers preserve useful error information.

#### Implementation

The project added:

- Email + Password auth alongside Magic Link / Email OTP,
- compact header account UI,
- profile storage,
- theme and language settings,
- profile and settings sync through local/cloud paths,
- Supabase setup documentation for Auth redirect URLs,
- error messages that preserve Supabase `message`, `details`, `hint`, and `code` when available.

#### Result

Authentication became easier to test, account settings became more durable, and cloud failures became diagnosable without inspecting Supabase manually first.

### 5. Ticket Management V1

#### Goal

Ticket Management V1 introduced the concept of ticket applications as separate records from event attendance. This reflected the Japanese concert workflow where users often apply, wait, win or lose, pay, receive tickets, and only later attend.

#### Problem

The first ticket model covered basic ticket application fields, but it did not fully describe real lottery behavior:

- a single `quantity` field was not enough,
- there was no distinction between applied quantity and won quantity,
- it could not represent multiple lottery rounds for the same performance,
- ticket spending and price display were not aligned with CNY-first usage,
- analytics could not accurately calculate quantity win rate or grouped performance success.

#### Design Decision

Ticket applications were modeled independently from events so that users could track tickets before an event record existed. Won / paid / issued / attended tickets could later create or link to event records.

#### Implementation

Ticket Management V1 supported:

- platform,
- status,
- quantity,
- price,
- companion,
- application/result/payment/issue dates,
- creation of event records from successful tickets,
- ticket statistics for basic win rate, planned spending, paid amount, and platform distribution.

#### Result

The feature made ticket tracking possible, but the V1 model exposed the need for a more precise grouped lottery model.

### 6. Ticket Management V2: Grouped Lottery Rounds

#### Goal

Ticket Management V2 was designed to represent real Japanese ticket lottery workflows: multiple rounds for one performance, different platforms or lottery phases, partial wins, payments, and round-level results.

#### Problem

V1 could not answer common questions:

- "I applied for 2 tickets but won 1; how should that be represented?"
- "I applied for the same performance in several rounds; should those be separate events?"
- "How do I compare round win rate, quantity win rate, and performance success?"
- "How do I track original currency and CNY display currency without automatic exchange rates?"

#### Design Decision

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

#### Implementation

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

#### Bugs / Debugging Notes

The most important edge cases were:

- ensuring new rounds inherit `ticketGroupKey`,
- preventing different dates or titles from merging incorrectly,
- preserving grouped context while resetting round-specific fields,
- keeping old ticket records compatible through fallback normalization,
- making cloud inserts avoid forcing frontend ids into Supabase uuid columns.

#### Result

Ticket Management V2 can represent multiple lottery rounds per performance while preserving a simple single-table data model. Analytics can distinguish:

- quantity win rate: won quantity / applied quantity,
- round win rate: winning resolved rounds / resolved rounds,
- performance success rate: grouped performances with at least one win / resolved performances.

### 7. Form Persistence and Browser Lifecycle Bugs

#### Goal

Event and ticket forms needed to survive browser lifecycle interruptions: refresh, tab switch, mobile backgrounding, pagehide, and returning from another page.

#### Problem

Users could lose unfinished form input when:

- switching pages or tabs,
- mobile browsers backgrounded the app,
- editing an existing event or ticket and returning later,
- refreshing before saving.

There was also a risk that a new-form draft could contaminate an edit-form draft or vice versa.

#### Design Decision

Drafts and sessions were kept local-only. They are not official records and are never written to Supabase before the user saves. The app separates:

- new event draft,
- edit event draft by event id,
- new ticket draft,
- edit ticket draft by ticket id,
- event form session,
- ticket form session.

#### Implementation

The app added:

- `draftStorage`,
- localStorage draft keys such as `stagelog-event-draft-new`, `stagelog-event-draft-edit-{eventId}`, `stagelog-ticket-draft-new`, and `stagelog-ticket-draft-edit-{ticketId}`,
- form session keys such as `stagelog-event-form-session` and `stagelog-ticket-form-session`,
- versioned draft envelopes,
- restore/discard flows,
- `visibilitychange`, `pagehide`, `beforeunload`, and unmount saves,
- save/cancel/delete cleanup paths.

#### Bugs / Debugging Notes

Important fixes included:

- edit drafts now include entity identity and are ignored if the id does not match,
- event edit sessions restore the same event instead of opening a blank form,
- save success clears the matching draft/session,
- File objects are not persisted in localStorage; image files must be reselected after reload.

#### Result

EventForm and TicketApplicationForm are more resilient to browser lifecycle behavior without polluting official records or cloud data.

### 8. Analytics V1 and Recharts Rendering Fix

#### Goal

Analytics V1 introduced visual dashboards for attendance trends and distributions.

#### Problem

The app had valid analytics data and fallback lists could render, but Recharts charts sometimes appeared blank or showed only legends. The issue was not caused by Supabase, missing data, or incorrect `dataKey` alone.

#### Debugging Notes

The diagnosis narrowed the issue to chart container measurement:

- data reached the Analytics component,
- fallback lists displayed values,
- chart cards existed,
- Recharts received data,
- `ResponsiveContainer` measurement was unstable inside the grid/card layout.

#### Design Decision

The project replaced Recharts `ResponsiveContainer` with a custom chart wrapper:

`ChartFrame + ResizeObserver`.

The chart wrapper measures container width directly and passes explicit `width` and `height` values to BarChart / LineChart components.

#### Implementation

The fix introduced:

- `ChartFrame`,
- `ResizeObserver` width measurement,
- explicit chart dimensions,
- fallback list rendering below charts,
- animation disabling for more deterministic rendering,
- more stable data shapes,
- explicit axis/grid/tooltip colors,
- `minPointSize` and visible dots where useful.

#### Result

Analytics uses stable chart sizing without `ResponsiveContainer`. This became a key technical decision and remains part of the current architecture.

### 9. Analytics V2: Weather and Ticket Analytics

#### Goal

Analytics V2 expanded the dashboard from attendance charts into weather and ticket performance analytics.

#### Implementation

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

#### Design Decision

Ticket analytics were updated to use V2 ticket fields:

- `appliedQuantity`,
- `wonQuantity`,
- `amountDisplay`,
- `displayCurrency`.

The app uses display-currency values for spending charts and defaults to CNY where needed. It does not hardcode JPY for current ticket spending analytics and does not perform automatic currency conversion.

#### Result

The analytics dashboard now covers attendance, weather, venue/region distribution, and ticket lottery performance using the current data model.

### 10. Backup Import / Export

#### Goal

Backup import/export was added to protect user data and support local/cloud migration.

#### Problem

The app stores several related data sets:

- events,
- ticket applications,
- profile,
- settings,
- custom venues,
- venue snapshots inside records.

A useful backup must preserve both library-style data (`customVenues`) and record snapshots (`venueName`, `city`, `country`) so historical records remain readable even if a venue library changes.

#### Design Decision

The backup format is JSON and app-level, not a database dump. It intentionally avoids Supabase secrets, sessions, and environment variables.

Cloud import does not force old backup ids into Supabase uuid columns. Instead, it writes through normal service functions so Supabase can generate or validate ids correctly. Custom venues are imported for the current user rather than trusting a backup `userId`.

#### Implementation

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

#### Bugs / Debugging Notes

Key fixes included:

- not forcing frontend ids into Supabase uuid columns,
- including V2 ticket fields in backup normalization,
- keeping old ticket data compatible with generated group keys and CNY defaults,
- supporting old backups without `customVenues`.

#### Result

Backup now supports both migration and recovery across local and cloud modes while preserving ticket grouping and venue history.

### 11. Venue UX A: Searchable and Temporary Custom Venues

#### Goal

Venue UX A improved venue selection and allowed users to record venues not present in the built-in venue database.

#### Problem

The original select-based venue input became limiting as venue data grew:

- built-in venue lists can never cover every livehouse or small event space,
- long selects are hard to use,
- users need search by English, Japanese, Chinese, alias, city, and region,
- temporary custom venue input is necessary for small or personal event spaces.

#### Design Decision

The first custom venue approach deliberately avoided a new `custom_venues` table. Custom venue data followed event/ticket records and historical candidates were inferred from saved records.

This "A" approach kept the first implementation low-risk:

- no Supabase schema change,
- no new RLS policy,
- no separate custom venue library,
- existing records simply stored venue snapshots.

#### Implementation

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

#### Bugs / Debugging Notes

Custom venues required compatibility across several flows:

- EventForm save should not fail when `venueId` is not built in,
- Ticket group keys should use `custom:` ids,
- adding another ticket round should inherit custom venue fields,
- custom venues without coordinates should not break weather fetch,
- custom venues should not attempt built-in seat maps.

#### Result

Users could search built-in venues or enter custom venues without schema changes. The limitation was that custom venue metadata could not be centrally managed or synced unless attached to records.

### 12. Custom Venues B-lite

#### Goal

Custom Venues B-lite introduced a user-owned custom venue library while preserving the safety of record-level venue snapshots.

#### Problem

Venue UX A was useful but limited:

- temporary custom venues were not a first-class library,
- aliases, notes, capacity, and coordinates were hard to maintain centrally,
- users could not proactively manage custom venues,
- cross-device custom venue sync required a formal cloud data model.

#### Design Decision

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

#### Implementation

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

#### Bugs / Debugging Notes

Key compatibility points:

- cloud import must use the current user id, not a backup user id,
- local import writes `stagelog-custom-venues`,
- old backups without `customVenues` still import,
- `custom:` ids must not be treated as Supabase uuid ids for events/tickets,
- TicketApplicationForm must preserve custom venue fields in next-round workflows,
- VenueCombobox must deduplicate saved custom venues and recent inferred venues.

#### Result

StageLog JP now supports both record-derived custom venues and a first-class user custom venue library with cloud/local persistence.

### 13. Mobile UX and Navigation Polish

#### Goal

The app needed to remain usable on phones, especially for forms, grouped ticket cards, venue search, and analytics charts.

#### Problem

Mobile-specific issues included:

- sticky header height,
- bottom navigation covering page content,
- ticket group card overflow,
- venue candidate list overflow,
- form buttons near the viewport bottom,
- analytics chart width constraints,
- long venue names, aliases, and notes.

#### Implementation

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

#### Result

The app uses the same data and business flows on desktop and mobile while adapting navigation and layout for narrow screens.

### 14. Regression Testing and Verification

#### Goal

As features accumulated, the project needed a written verification trail to prevent regressions across cloud/local mode, ticket grouping, analytics, backup, venue search, and mobile layout.

#### Implementation

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

#### Result

`VERIFICATION.md` now records build status, known manual checks, and cross-module regression notes. The current build passes with the known Vite chunk size warning.

### 15. Current Architecture Summary

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

### 16. Known Limitations

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

### 17. Future Improvements

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

### 18. Personal Reflections

The main difficulty in this project was not the number of screens. The harder work was shaping the data model around real usage: ticket lottery rounds, form recovery, venue snapshots, cloud/local behavior, and analytics that remain stable as the model grows.

The most important iterations were Ticket Management V2, the Recharts rendering fix, and the evolution from Venue UX A to Custom Venues B-lite. Those changes improved the underlying model instead of only adding UI surface area.

At this point, the project should not keep adding features without restraint. The next useful step is more real usage, regression testing, clearer error handling, and selective improvements based on actual friction.

### 19. Things Not to Build Yet

The following ideas should stay out of scope until there is a clearer need and a specific design:

- full custom venue merge/dedup tooling,
- custom venue seat maps,
- automatic geocoding,
- batch-updating historical records after deleting or editing a customVenue,
- automatic exchange-rate APIs,
- a large rewrite of Ticket Management V2,
- reintroducing ResponsiveContainer.

### 20. Recent Iterations After the First Development Log

This section records the main iterations added after the first DEVELOPMENT_LOG draft. They are not large rewrites; they are field additions, workflow polish, SQL maintenance, and targeted bug fixes driven by real usage.

#### 20.1 Ticket Edit and Ticket-to-Event UX

**Problem**: Ticket Management V2 already supported adding a round to an existing performance and saving while continuing to the next round. Editing an existing ticket round, however, did not scroll to `TicketApplicationForm` the same way. Another issue was the create-event-from-ticket flow: clicking "Create Event Record" from a ticket round could leave the user on the ticket page without a usable event form.

**Design Decision**: These were navigation and form-positioning issues, not data model issues. The fix reused existing form refs, scroll helpers, focus requests, and session state rather than changing Ticket V2.

**Implementation**: Editing a ticket round now switches into edit mode, scrolls to `TicketApplicationForm`, and prefers focusing `roundName`. Creating an event from a ticket now switches to the new EventForm flow, pre-fills event title, artist, date, venue snapshot, seat/notes context where available, scrolls to the form, and avoids creating duplicate events when a ticket already has `linkedEventId`.

**Result**: Add round, edit round, save-and-add-next-round, and create-event-from-ticket are now more continuous workflows. This did not change `ticket_applications` schema and did not add a `ticket_groups` table.

#### 20.2 Event Time Model: Doors Open and Show Start

**Problem**: EventForm originally had only `startTime`, but Japanese live events often need both doors-open time and show-start time. Keeping only start time loses useful arrival and schedule context.

**Design Decision**: Add `doorsOpenTime` to the event model and `events.doors_open_time` to Supabase. The important constraint is that `doors_open_time` must be `text`, because the existing `events.start_time` field is also `text`. It should not be `time` or `timestamptz`.

**Implementation**: `supabase/sql/07_events_doors_open_time.sql` ensures `doors_open_time text` exists and converts a mistakenly-created time-like column back to `text`. EventForm adds a doors-open input before start time. EventRecord / EventFormValues / cloud mapping / local storage / backup import-export all preserve `doorsOpenTime`. Display helpers normalize values such as `16:00:00` to `16:00`.

**Result**: Events can display `Doors 15:00 / Start 16:00` or the Chinese equivalent. Old records without `doorsOpenTime` remain compatible.

#### 20.3 Supabase SQL File Organization

**Problem**: As events, ticket applications, custom venues, storage, schema compatibility, and check scripts accumulated, `supabase/sql` became harder to maintain. Some older filenames no longer described execution order or responsibility clearly.

**Design Decision**: Do not merge historical migrations into one large file and do not change business schema logic. Organize filenames, split responsibilities, add README guidance, and move read-only checks into a dedicated folder.

**Implementation**: `supabase/sql` is now organized by recommended run order: profiles/settings, events core, event image storage, ticket applications core, Ticket V2, custom venues, and doors-open time. `checks/` contains read-only scripts for events columns, ticket_applications columns, custom_venues columns, and RLS policies. `supabase/sql/README.md` documents purpose, run order, migration responsibilities, check scripts, manual verification queries, and the need to run `notify pgrst, 'reload schema';` after schema changes.

**Result**: The SQL directory is now a readable migration record rather than a loose collection of patches. Pushing SQL files to GitHub still does not automatically update Supabase; the SQL must be run manually in the SQL Editor or through a migration tool.

#### 20.4 Custom Venue Coordinates and Weather

**Problem**: Custom Venues B-lite allowed latitude / longitude to be stored in `custom_venues`, but the weather fetch path originally relied mostly on built-in venues. A custom venue with coordinates could still be treated as if it had no coordinates.

**Design Decision**: `weatherService` should not know how to search built-in venues, saved custom venues, or historical inferred venues. Coordinate resolution should happen in frontend utilities before calling the weather service.

**Implementation**: `venueSearchUtils` gained a unified coordinate resolver. Its priority is: current event/form snapshot coordinates, built-in venue id, customVenues id, customVenues name + city, then recent inferred venues. It accepts number and string coordinates, validates latitude in `-90..90` and longitude in `-180..180`, and keeps valid `0` values. Event weather fetch and event card disabled-state logic use this resolver.

**Result**: Custom venues with coordinates can fetch weather. Missing or invalid coordinates now show a more accurate message asking the user to add latitude / longitude to the custom venue. This is not automatic geocoding; coordinates are still maintained manually.

#### 20.5 Syncing Custom Venue Coordinates into EventForm

**Problem**: After editing latitude / longitude in CustomVenuesManager, selecting that customVenue in a new EventForm could still behave as if coordinates were missing. The problem was not schema-related; it was a frontend state-chain issue across customVenue library state, VenueCombobox, EventForm state, and weather coordinate resolution.

**Design Decision**: Do not rewrite EventForm, VenueCombobox, or CustomVenuesManager. Tighten the coordinate path. Saved custom venue coordinates should enter App customVenues state immediately after create/update; VenueCombobox should return coordinates when selecting a customVenue; EventForm should fill missing coordinates from customVenues state when the selected customVenue is known.

**Implementation**: `customVenueService` now range-cleans latitude / longitude. CustomVenuesManager and VenueCombobox validate out-of-range coordinates and show a clear error instead of silently dropping values. EventForm has a conservative sync effect: when the current selected venue is a formal customVenue and the form lacks coordinates, it fills latitude / longitude from App-provided customVenues without overwriting an existing event snapshot.

**Result**: After maintaining coordinates in "My custom venues", selecting that customVenue in a new event immediately gives EventForm usable coordinates. Creating a customVenue with coordinates from EventForm also keeps those coordinates in form state. Existing events without coordinate snapshots can still resolve coordinates by customVenues id.

#### 20.6 Timeline UI V1 Polish

**Problem**: Timeline could display events, but visually it felt like a plain list. The relationship between year, date, and event was not strong enough, and doors/start/weather metadata was crowded.

**Design Decision**: Treat this as Timeline UI V1 polish only. Do not change data ordering, grouping, schema, filters, calendar views, or month collapsing.

**Implementation**: Timeline keeps the existing year grouping and `sortByDateDesc` ordering, but the display now looks more like a timeline: stronger year headers, a date column, node dots, vertical connector lines, and timeline-specific cards. Doors, start time, and weather are shown as badges. Upcoming/completed status is calculated in UI from `event.date` and displayed as lightweight badges. Mobile layout uses a simplified single-column version to avoid horizontal overflow.

**Result**: Timeline now reads as a timeline rather than a regular list, without affecting EventForm, Ticket Management V2, Analytics, Backup, or Supabase schema.
