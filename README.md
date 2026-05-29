# StageLog JP

<details open>
<summary><strong>English</strong></summary>

<br>

A personal live event archive web app for anime, idol, and live concert fans in Japan.

StageLog JP helps users record their live event experiences with ticket-style cards, venue information, seat details, automatic weather matching, and attendance statistics.

## Preview

> Screenshots will be added here.

## Features

### Event Archive

Users can create and manage live event records with:

- Event title
- Artist / performer
- Date and time
- Venue
- City / country
- Ticket type
- Seat information
- Notes and memories
- Event images

### Ticket-Style UI

Each event is displayed as a ticket-like card inspired by real live concert ticket stubs.

The card includes:

- Event name
- Artist name
- Venue
- Seat information
- Date
- Category tag
- Decorative barcode style

### Year and Artist Filters

Users can filter events by:

- Year
- Artist
- Venue
- Event type

This makes it easier to browse and organize past live event experiences.

### Automatic Weather Matching

StageLog JP can automatically match weather data based on:

- Event date
- Venue location
- Event time

The web app stores weather information such as:

- Temperature
- Rainfall
- Wind speed
- Weather condition

This allows users to remember what the weather was like on the day of each live event.

### Weather Ranking

The app can generate personal live event weather rankings, such as:

- Hottest live event
- Coldest live event
- Rainiest live event
- Windiest live event

### Venue Seat Visualization

For supported venues, StageLog JP can display a simplified venue map and mark the user's seat position.

Planned supported venues include:

- Tokyo Dome
- Belluna Dome
- K-Arena Yokohama
- Pia Arena MM
- Yokohama Arena
- Zepp Haneda

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Open-Meteo API
- SVG-based venue maps

## Project Goals

This project is designed as both a personal tool and a portfolio project.

The goal is to build a practical web app for Japanese live event fans while demonstrating frontend development, data modeling, API integration, UI design, and data visualization skills.

## Roadmap

### Version 1

- Add, edit, and delete event records
- Ticket-style event card UI
- Year filter
- Artist filter
- Venue filter
- Manual seat information input
- Automatic weather matching

### Version 2

- Weather ranking page
- Artist statistics
- Venue statistics
- Event image upload
- Improved mobile UI

### Version 3

- SVG venue maps
- Seat position visualization
- Multiple attendance records on the same venue map
- Support for major Japanese venues

### Version 4

- Ticket lottery management
- Winning / losing result tracking
- Payment status
- Ticket issuing status
- Companion management

## Why I Built This

As a fan of Japanese anime and idol live events, I wanted to create a tool that could preserve not only basic event information, but also the small details that make each live experience memorable.

Existing note-taking apps are too general, while ticketing apps do not focus on personal memories and long-term statistics.

StageLog JP combines live event records, ticket-style design, weather data, and venue visualization into one personal archive.

## License

MIT License

</details>

---

<details>
<summary><strong>中文</strong></summary>

<br>

一个面向日本动漫 Live、偶像活动、声优演唱会和音乐现场的个人参战记录 Web App。

StageLog JP 可以帮助用户用票根风格的卡片记录自己的 Live 参战经历，包括活动信息、会场、座位、天气、统计数据和个人回忆。

## 预览

> 项目截图之后会添加在这里。

## 功能

### 参战记录归档

用户可以创建和管理自己的 Live 参战记录，包括：

- 活动名称
- 艺人 / 出演者
- 日期和时间
- 会场
- 城市 / 国家
- 票种
- 座位信息
- 备注和回忆
- 活动图片

### 票根风格 UI

每一条参战记录都会以票根卡片的形式展示，设计灵感来自真实演唱会门票。

卡片内容包括：

- 活动名称
- 艺人名称
- 会场
- 座位信息
- 日期
- 分类标签
- 条形码风格装饰

### 年份和艺人筛选

用户可以按照以下条件筛选参战记录：

- 年份
- 艺人
- 会场
- 活动类型

这样可以更方便地浏览和整理过去参加过的 Live 与活动。

### 自动天气匹配

StageLog JP 可以根据以下信息自动匹配天气数据：

- 活动日期
- 会场位置
- 活动时间

Web App 会保存以下天气信息：

- 温度
- 降水量
- 风速
- 天气状况

这样用户可以回顾每一场 Live 当天的天气情况。

### 天气排行

应用可以生成个人参战天气排行，例如：

- 最热的 Live
- 最冷的 Live
- 雨量最大的 Live
- 风最大的 Live

### 会场座位可视化

对于支持的会场，StageLog JP 可以显示简化版会场座位图，并标记用户当时的座位位置。

计划支持的会场包括：

- 东京巨蛋
- Belluna Dome
- K-Arena Yokohama
- Pia Arena MM
- 横滨 Arena
- Zepp Haneda

## 技术栈

- React
- Vite
- TypeScript
- Tailwind CSS
- Open-Meteo API
- SVG 会场座位图

## 项目目标

这个项目既是一个个人工具，也是一个作品集项目。

目标是为日本 Live 粉丝构建一个实用的参战记录 Web App，同时展示前端开发、数据建模、API 集成、UI 设计和数据可视化能力。

## 开发路线

### Version 1

- 新增、编辑、删除参战记录
- 票根风格卡片 UI
- 年份筛选
- 艺人筛选
- 会场筛选
- 手动输入座位信息
- 自动天气匹配

### Version 2

- 天气排行页面
- 艺人统计
- 会场统计
- 活动图片上传
- 移动端 UI 优化

### Version 3

- SVG 会场座位图
- 座位位置标记
- 同一会场多次参战位置叠加
- 支持更多日本主要会场

### Version 4

- 票务抽选管理
- 当选 / 落选结果记录
- 入金状态
- 发券状态
- 同行者管理

## 为什么做这个项目

作为日本动漫 Live 和偶像活动的爱好者，我希望做一个工具，不只是记录活动名称和日期，而是能保存每一场现场体验中的细节。

普通笔记应用太泛用，票务应用又不关注个人回忆和长期统计。

StageLog JP 希望把参战记录、票根风格设计、天气数据和会场座位可视化结合起来，做成一个真正适合日本 Live 粉丝使用的个人归档工具。

## License

MIT License

</details>
