# StageLog JP

StageLog JP 是一个面向日本 anime / idol / live concert 粉丝的个人参战记录 Web App。它用票根风格卡片保存 Live 参战经历，包括活动、艺人、会场、座位、备注、筛选、统计和自动天气匹配。

## MVP 功能

- 新增、编辑、删除参战记录
- 使用 `localStorage` 持久化保存，key 为 `stagelog-events`
- 票根风格卡片 UI
- 按年份、艺人、会场和关键词筛选
- 内置日本常见 Live 会场及近似坐标
- 接入 Open-Meteo Archive API 获取历史小时级天气
- 统计和天气排行
- 移动端优先的响应式布局

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```
