# StageLog JP

<details open>
<summary><strong>English</strong></summary>

StageLog JP is a personal live event archive for anime, idol, and live concert fans in Japan. It records attendance memories as ticket-style cards with venue, seat, notes, filters, local statistics, and historical weather matching.

## MVP Features

- Create, edit, and delete event records
- Persist records in `localStorage` with the key `stagelog-events`
- Ticket-stub inspired event cards with accent bars, dotted stub edge, and barcode decoration
- Year, artist, venue, and keyword filters
- Seeded Japanese venue list with approximate coordinates
- Historical weather lookup through the Open-Meteo Archive API
- Statistics for total events, artists, venues, most watched artist, most visited venue, and weather rankings
- Mobile-first responsive layout

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS via `@tailwindcss/vite`
- Open-Meteo Archive API
- Browser `localStorage`

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Data Model

The first MVP stores `EventRecord` objects in the browser. Each record includes event details, venue metadata, ticket type, structured seat fields, notes, timestamps, and optional weather information.

## Weather

Use the `Fetch Weather` button on an event card. StageLog JP reads the event date, start time, and venue coordinates, then saves the closest hourly historical weather record back to the event. Future dates show a friendly unavailable message.

## License

MIT License

</details>

---

<details>
<summary><strong>中文</strong></summary>

StageLog JP 是一个面向日本 anime / idol / live concert 粉丝的个人参战记录 Web App。它用票根风格卡片保存 Live 参战经历，包括活动、艺人、会场、座位、备注、筛选、统计和自动天气匹配。

## MVP 功能

- 新增、编辑、删除参战记录
- 使用 `localStorage` 持久化保存，key 为 `stagelog-events`
- 票根风格卡片 UI，包含彩色侧边、虚线票根边缘和条形码装饰
- 按年份、艺人、会场和关键词筛选
- 内置日本常见 Live 会场及近似坐标
- 接入 Open-Meteo Archive API 获取历史小时级天气
- 统计总参战数、今年参战数、唯一艺人数、唯一会场数、最多观看艺人、最常去会场
- 天气排行：最热、最冷、雨量最大、风最大的一场 Live
- 移动端优先的响应式布局

## 技术栈

- React
- Vite
- TypeScript
- Tailwind CSS，通过 `@tailwindcss/vite` 配置
- Open-Meteo Archive API
- 浏览器 `localStorage`

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 数据说明

第一版 MVP 不使用后端，也不使用 Supabase。所有 `EventRecord` 都保存在浏览器本地，包含活动信息、会场信息、票种、结构化座位、备注、创建和更新时间，以及可选天气数据。

## 天气匹配

在每张参战卡片上点击 `Fetch Weather`。应用会根据活动日期、开演时间和会场坐标，请求 Open-Meteo 历史天气接口，并保存最接近开演时间的小时级天气数据。未来日期会显示友好提示。

## License

MIT License

</details>
