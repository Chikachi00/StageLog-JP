# StageLog JP Development Log

This document is a bilingual development retrospective for StageLog JP. It covers product iteration, technical decisions, critical bugs, architecture evolution, verification notes, and known limitations.

[中文](#中文版) | [English](#english-version)

---

## 中文版

这份开发日志基于 Git commit history、README、VERIFICATION、Supabase 配置说明和当前项目结构整理。它不是逐 commit 流水账，而是按产品阶段和工程问题复盘 StageLog JP 的演进过程。

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

---

## English Version

This document summarizes the StageLog JP development process by product and engineering phases. It is based on the repository commit history, README, verification notes, Supabase setup notes, and the current project structure.

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
