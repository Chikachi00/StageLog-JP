# StageLog JP

StageLog JP 是一个面向日本 anime / idol / live concert 粉丝的个人参战记录 Web App。它用票根风格卡片保存 Live 参战经历，包含活动、艺人、会场、座位、备注、筛选、统计、历史天气匹配、座位图和票务抽选管理。

## 已实现功能

- V1：参战记录 CRUD、localStorage、票根卡片、筛选、Open-Meteo 天气匹配、统计和 sample data
- 会场数据：内置日本 Live / 动漫 / 偶像活动中常见的会场，覆盖东京、千叶、神奈川、埼玉、关西、中部、九州和北海道等地区
- V2：增强票根 UI、主题切换、English / 中文界面切换、图片上传、Timeline、增强统计
- V3：数据驱动分区座位图、block / level 自动匹配高亮、座位位置点选、Venues 页面、多次参战位置叠加
- V4：票务抽选管理、当落、入金/发券状态、同行者、票价统计、当选后创建参战记录
- Supabase：邮箱 Magic Link 登录、Events 云同步、Tickets 云同步、用户资料同步、语言/主题设置同步、Supabase Storage 活动图片上传、Row Level Security、本地数据导入云端

未登录时应用继续使用 localStorage；登录后可使用 Supabase 云端同步。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## Supabase 配置

可选环境变量：

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

不要在前端代码或仓库中使用 `service_role` / secret key。

运行剩余云端功能前，请在 Supabase SQL Editor 执行：

```text
supabase/sql/02_remaining_cloud_features.sql
```

更多步骤见 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)。

## 本地存储 Key

- `stagelog-events`
- `stagelog-theme`
- `stagelog-language`
- `stagelog-ticket-applications`

## 说明

- Supabase 是可选功能；如果没有配置环境变量，应用会回退到 localStorage 模式。
- 登录用户可以通过 Supabase 同步参战记录、票务抽选记录、用户资料、语言/主题设置和活动图片。
- Guest 模式下，图片仍以 base64 data URL 形式保存在当前浏览器。
- 会场座位图是项目内自绘的简化 SVG / React SVG，不使用外部版权座席图。

## License

MIT License
