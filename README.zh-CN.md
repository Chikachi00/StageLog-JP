# StageLog JP

StageLog JP 是一个面向日本 anime / idol / live concert 粉丝的个人参战记录 Web App。它用票根风格卡片保存 Live 参战经历，包括活动、艺人、会场、座位、备注、筛选、统计、历史天气匹配、座位图和票务抽选管理。

## 已实现功能

- V1：参战记录 CRUD、localStorage、票根卡片、筛选、Open-Meteo 天气匹配、统计和 sample data
- 会场数据：内置日本 Live / 动漫 / 偶像活动中常见会场，覆盖东京、千叶、神奈川、埼玉、关西、中部、九州和北海道等地区
- V2：增强票根 UI、主题切换、English / 中文界面切换、图片上传、Timeline、增强统计
- V3：数据驱动分区座位图、block / level 自动匹配高亮、座位位置点选、Venues 页面、多次参战位置叠加；当前支持 Tokyo Dome、Belluna Dome、K-Arena Yokohama、Ariake Arena、Makuhari Messe Event Hall、Saitama Super Arena
- V4：票务抽选管理、当落/入金/发券状态、同行者、票价统计、当选后创建参战记录
- 可选 Supabase：邮箱 Magic Link 登录、Events 云端同步、Row Level Security、导入本地数据到云端；未登录时继续使用 localStorage，Tickets 和图片暂不云端同步

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
