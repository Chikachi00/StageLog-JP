import type { EventRecord } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import {
  buildYearlySharePosterStats,
  formatPosterDate,
  getEventCode,
  getEventLocationLabel,
  getPosterDateRange,
  getSeatSummary,
  sortPosterEvents,
  STAGELOG_GITHUB_URL,
  truncatePosterText,
  type SharePosterPrivacyOptions,
  type SharePosterText,
  type SharePosterTheme,
} from "./sharePosterUtils";

export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1350;

interface PosterThemePalette {
  background: string;
  background2: string;
  paper: string;
  ticket: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accent2: string;
  accent3: string;
  shadow: string;
}

export interface SharePosterTemplateOptions {
  theme: SharePosterTheme;
  privacy: SharePosterPrivacyOptions;
  text: SharePosterText;
  language: string;
}

export interface YearlyReportPosterOptions extends SharePosterTemplateOptions {
  year: string;
  ticketApplications: TicketApplication[];
}

const palettes: Record<SharePosterTheme, PosterThemePalette> = {
  sakura: {
    background: "#fff7fb",
    background2: "#ffe7f1",
    paper: "#fffafd",
    ticket: "#ffffff",
    ink: "#2f2430",
    muted: "#765c6c",
    line: "#ead7e2",
    accent: "#e84f7a",
    accent2: "#b14f9f",
    accent3: "#f4b942",
    shadow: "#d54c771f",
  },
  ocean: {
    background: "#f1fbfd",
    background2: "#dff5fb",
    paper: "#ffffff",
    ticket: "#fafdff",
    ink: "#142536",
    muted: "#547084",
    line: "#cfe2eb",
    accent: "#0e7490",
    accent2: "#2563eb",
    accent3: "#14b8a6",
    shadow: "#0e74901f",
  },
  night: {
    background: "#07101f",
    background2: "#101827",
    paper: "#121c2e",
    ticket: "#172235",
    ink: "#edf2ff",
    muted: "#a8b3c7",
    line: "#2e3c56",
    accent: "#88a2ff",
    accent2: "#56d8cb",
    accent3: "#f4b942",
    shadow: "#00000040",
  },
  classic: {
    background: "#faf9f6",
    background2: "#eee9df",
    paper: "#ffffff",
    ticket: "#fffdf8",
    ink: "#252525",
    muted: "#646464",
    line: "#dedbd5",
    accent: "#4f5d75",
    accent2: "#2d7d7a",
    accent3: "#b08968",
    shadow: "#4f5d751f",
  },
};

export const escapeSvgText = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const text = (
  value: unknown,
  x: number,
  y: number,
  options: {
    size?: number;
    weight?: number;
    fill?: string;
    anchor?: "start" | "middle" | "end";
    opacity?: number;
    transform?: string;
    family?: string;
  } = {},
) =>
  `<text x="${x}" y="${y}" fill="${options.fill ?? "currentColor"}" font-family="${options.family ?? "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"}" font-size="${options.size ?? 28}" font-weight="${options.weight ?? 700}" text-anchor="${options.anchor ?? "start"}"${options.opacity ? ` opacity="${options.opacity}"` : ""}${options.transform ? ` transform="${options.transform}"` : ""}>${escapeSvgText(value)}</text>`;

const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  options: { fill?: string; stroke?: string; radius?: number; opacity?: number; strokeWidth?: number; dash?: string } = {},
) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${options.radius ?? 0}" fill="${options.fill ?? "none"}"${options.stroke ? ` stroke="${options.stroke}"` : ""}${options.strokeWidth ? ` stroke-width="${options.strokeWidth}"` : ""}${options.dash ? ` stroke-dasharray="${options.dash}"` : ""}${options.opacity ? ` opacity="${options.opacity}"` : ""}/>`;

const circle = (cx: number, cy: number, r: number, fill: string, opacity?: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${opacity ? ` opacity="${opacity}"` : ""}/>`;

const truncateForWidth = (value: string, maxChars: number) => truncatePosterText(value, maxChars);

const getTimeLine = (event: EventRecord, labels: SharePosterText) => {
  const doors = event.doorsOpenTime ? `${labels.doors} ${event.doorsOpenTime.slice(0, 5)}` : "";
  const start = event.startTime ? `${labels.start} ${event.startTime.slice(0, 5)}` : "";
  return [doors, start].filter(Boolean).join(" / ");
};

const getOptionalEventLines = (
  event: EventRecord,
  privacy: SharePosterPrivacyOptions,
  labels: SharePosterText,
  compact = false,
) => {
  const lines: string[] = [];
  const timeLine = getTimeLine(event, labels);

  if (timeLine) {
    lines.push(timeLine);
  }

  if (privacy.showWeather && event.weather) {
    lines.push(`${labels.weather} ${event.weather.temperature.toFixed(1)}°C`);
  }

  if (privacy.showSeat) {
    const seat = getSeatSummary(event);

    if (seat) {
      lines.push(`${labels.seat} ${truncateForWidth(seat, compact ? 30 : 42)}`);
    }
  }

  if (privacy.showTicketType && event.ticketType) {
    lines.push(`${labels.ticketType} ${truncateForWidth(event.ticketType, compact ? 24 : 34)}`);
  }

  if (privacy.showNotes && event.notes) {
    lines.push(`${labels.notes} ${truncateForWidth(event.notes, compact ? 32 : 48)}`);
  }

  return lines;
};

const barcode = (x: number, y: number, width: number, height: number, fill: string, opacity = 0.72) => {
  const bars = [2, 4, 2, 6, 3, 2, 5, 2, 3, 6, 2, 4, 3, 2, 5, 2, 6, 3, 2, 4];
  const total = bars.reduce((sum, value) => sum + value, 0) + bars.length * 3;
  let cursor = x;

  return bars
    .map((bar, index) => {
      const barWidth = Math.max(2, (bar / total) * width * 2.5);
      const gap = width / bars.length / 3;
      const element = rect(cursor, y + (index % 4) * 3, barWidth, height - (index % 3) * 8, {
        fill,
        radius: 2,
        opacity,
      });
      cursor += barWidth + gap;
      return element;
    })
    .join("");
};

const ticketStub = (
  event: EventRecord,
  index: number,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: PosterThemePalette,
  options: SharePosterTemplateOptions,
  compact = false,
) => {
  const stubWidth = Math.max(118, Math.round(width * 0.24));
  const mainWidth = width - stubWidth;
  const maxTitle = compact ? 24 : width > 620 ? 42 : 32;
  const optionalLines = getOptionalEventLines(event, options.privacy, options.text, compact).slice(0, compact ? 2 : 4);
  const lineHeight = compact ? 28 : 31;
  const titleY = y + (compact ? 72 : 82);
  const metaY = y + height - (compact ? 42 : 50);

  return `
    <g>
      ${rect(x + 8, y + 10, width, height, { fill: palette.shadow, radius: 28, opacity: 0.8 })}
      ${rect(x, y, width, height, { fill: palette.ticket, stroke: palette.line, radius: 28, strokeWidth: 2 })}
      ${rect(x, y, 10, height, { fill: palette.accent, radius: 28, opacity: 0.95 })}
      <line x1="${x + mainWidth}" y1="${y + 22}" x2="${x + mainWidth}" y2="${y + height - 22}" stroke="${palette.line}" stroke-width="3" stroke-dasharray="10 12"/>
      ${circle(x + mainWidth, y - 1, 14, palette.background)}
      ${circle(x + mainWidth, y + height + 1, 14, palette.background)}
      ${text(formatPosterDate(event.date), x + 32, y + 42, { size: compact ? 22 : 25, weight: 900, fill: palette.accent })}
      ${text(truncateForWidth(event.title, maxTitle), x + 32, titleY, { size: compact ? 28 : 34, weight: 900, fill: palette.ink })}
      ${text(truncateForWidth(event.artist, compact ? 26 : 36), x + 32, titleY + lineHeight, { size: compact ? 21 : 24, weight: 800, fill: palette.accent2 })}
      ${text(truncateForWidth([event.venueName, getEventLocationLabel(event)].filter(Boolean).join(" · "), compact ? 36 : 58), x + 32, titleY + lineHeight * 2, { size: compact ? 18 : 21, weight: 700, fill: palette.muted })}
      ${optionalLines.map((line, lineIndex) => text(line, x + 32, titleY + lineHeight * (3 + lineIndex), { size: compact ? 16 : 18, weight: 700, fill: palette.muted })).join("")}
      ${text(getEventCode(event), x + 32, metaY, { size: compact ? 15 : 17, weight: 900, fill: palette.muted, family: "Consolas, SFMono-Regular, monospace" })}
      ${barcode(x + mainWidth + 32, y + 42, stubWidth - 64, Math.max(64, height - 116), palette.ink, options.theme === "night" ? 0.55 : 0.62)}
      ${text(String(index + 1).padStart(2, "0"), x + mainWidth + stubWidth / 2, y + height - 36, { size: compact ? 24 : 28, weight: 900, fill: palette.accent, anchor: "middle", family: "Consolas, SFMono-Regular, monospace" })}
    </g>
  `;
};

const posterShell = (content: string, palette: PosterThemePalette, titleId: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}" role="img" aria-labelledby="${titleId}">
  <title id="${titleId}">StageLog JP Share Poster</title>
  <defs>
    <radialGradient id="stageGlowA" cx="16%" cy="8%" r="72%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.22"/>
      <stop offset="58%" stop-color="${palette.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="stageGlowB" cx="86%" cy="12%" r="72%">
      <stop offset="0%" stop-color="${palette.accent2}" stop-opacity="0.18"/>
      <stop offset="62%" stop-color="${palette.accent2}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="posterBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.background}"/>
      <stop offset="100%" stop-color="${palette.background2}"/>
    </linearGradient>
  </defs>
  ${rect(0, 0, POSTER_WIDTH, POSTER_HEIGHT, { fill: "url(#posterBg)" })}
  <rect width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" fill="url(#stageGlowA)"/>
  <rect width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" fill="url(#stageGlowB)"/>
  ${Array.from({ length: 46 }, (_, index) => circle(58 + (index % 10) * 108, 1030 + Math.floor(index / 10) * 58, 2, palette.line, 0.42)).join("")}
  ${content}
</svg>
`;

const attribution = (palette: PosterThemePalette, labels: SharePosterText, language: string) => {
  const generated = language.startsWith("zh")
    ? `${labels.generatedBy} · github.com/Chikachi00/StageLog-JP`
    : `${labels.generatedBy} · github.com/Chikachi00/StageLog-JP`;

  return `
    ${rect(82, 1266, 916, 42, { fill: palette.paper, stroke: palette.line, radius: 21, opacity: 0.88 })}
    ${text(generated, 540, 1294, { size: 18, weight: 800, fill: palette.muted, anchor: "middle" })}
  `;
};

const getTicketGrid = (count: number) => {
  if (count <= 2) {
    return { columns: 1, width: 860, height: 230, gapX: 0, gapY: 30, startX: 110, startY: 320, compact: false };
  }

  if (count <= 4) {
    return { columns: 1, width: 860, height: 176, gapX: 0, gapY: 24, startX: 110, startY: 306, compact: false };
  }

  if (count <= 8) {
    return { columns: 2, width: 420, height: 180, gapX: 28, gapY: 24, startX: 106, startY: 292, compact: true };
  }

  return { columns: 2, width: 420, height: 142, gapX: 28, gapY: 18, startX: 106, startY: 286, compact: true };
};

export const generateSelectedEventsPosterSvg = (
  selectedEvents: EventRecord[],
  options: SharePosterTemplateOptions,
) => {
  const palette = palettes[options.theme];
  const events = sortPosterEvents(selectedEvents).slice(0, 12);
  const grid = getTicketGrid(events.length);
  const dateRange = getPosterDateRange(events);

  const tickets = events
    .map((event, index) => {
      const column = index % grid.columns;
      const row = Math.floor(index / grid.columns);
      return ticketStub(
        event,
        index,
        grid.startX + column * (grid.width + grid.gapX),
        grid.startY + row * (grid.height + grid.gapY),
        grid.width,
        grid.height,
        palette,
        options,
        grid.compact,
      );
    })
    .join("");

  const content = `
    ${text("StageLog JP", 82, 98, { size: 30, weight: 950, fill: palette.accent })}
    ${text(options.text.selectedHeading, 82, 158, { size: 58, weight: 950, fill: palette.ink })}
    ${text(options.text.selectedSubtitle, 82, 204, { size: 24, weight: 800, fill: palette.muted })}
    ${rect(780, 84, 220, 70, { fill: palette.paper, stroke: palette.line, radius: 35, opacity: 0.9 })}
    ${text(dateRange || `${events.length} MEMORIES`, 890, 128, { size: 26, weight: 950, fill: palette.accent2, anchor: "middle" })}
    ${tickets}
    ${options.privacy.showAttribution ? attribution(palette, options.text, options.language) : ""}
  `;

  return posterShell(content, palette, "selected-events-poster-title");
};

export const generateYearlyReportPosterSvg = (
  eventsInYear: EventRecord[],
  options: YearlyReportPosterOptions,
) => {
  const palette = palettes[options.theme];
  const sortedEvents = sortPosterEvents(eventsInYear);
  const visibleEvents = sortedEvents.slice(0, 12);
  const moreCount = Math.max(0, eventsInYear.length - visibleEvents.length);
  const stats = buildYearlySharePosterStats(eventsInYear, options.ticketApplications, options.year, options.text.noData);
  const compactOptions = { ...options, privacy: { ...options.privacy, showNotes: false } };

  const statItems: Array<[string, string | number]> = [
    [options.text.liveEvents, stats.eventCount],
    [options.text.unlockedCities, stats.cityCount],
    [options.text.unlockedVenues, stats.venueCount],
    [options.text.countries, stats.countryCount],
    [options.text.ticketRounds, stats.ticketRoundCount],
    [options.privacy.showPrice ? options.text.price : options.text.weatherRecords, options.privacy.showPrice ? stats.paidSpendingLabel : stats.weatherRecordCount],
  ];

  const statCards = statItems
    .map(([label, value], index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 82 + column * 306;
      const y = 260 + row * 122;
      return `
        ${rect(x, y, 278, 96, { fill: palette.paper, stroke: palette.line, radius: 24, opacity: 0.92 })}
        ${text(label, x + 24, y + 34, { size: 18, weight: 800, fill: palette.muted })}
        ${text(value, x + 24, y + 76, { size: 40, weight: 950, fill: index % 2 === 0 ? palette.accent : palette.accent2 })}
      `;
    })
    .join("");

  const grid = { columns: 2, width: 420, height: 122, gapX: 28, gapY: 15, startX: 106, startY: 620, compact: true };
  const tickets = visibleEvents
    .map((event, index) => {
      const column = index % grid.columns;
      const row = Math.floor(index / grid.columns);
      return ticketStub(
        event,
        index,
        grid.startX + column * (grid.width + grid.gapX),
        grid.startY + row * (grid.height + grid.gapY),
        grid.width,
        grid.height,
        palette,
        compactOptions,
        grid.compact,
      );
    })
    .join("");

  const firstLatest = `
    ${text(`${options.text.mostVisitedCity}: ${truncateForWidth(stats.mostVisitedCity, 38)}`, 82, 516, { size: 22, weight: 800, fill: palette.muted })}
    ${text(`${options.text.mostVisitedVenue}: ${truncateForWidth(stats.mostVisitedVenue, 38)}`, 82, 552, { size: 22, weight: 800, fill: palette.muted })}
    ${stats.firstLive ? text(`${options.text.firstLive}: ${truncateForWidth(stats.firstLive.title, 38)}`, 560, 516, { size: 22, weight: 800, fill: palette.muted }) : ""}
    ${stats.latestLive ? text(`${options.text.latestLive}: ${truncateForWidth(stats.latestLive.title, 38)}`, 560, 552, { size: 22, weight: 800, fill: palette.muted }) : ""}
  `;

  const content = `
    ${text("StageLog JP", 82, 94, { size: 30, weight: 950, fill: palette.accent })}
    ${text(`${options.year} LIVE`, 82, 164, { size: 74, weight: 950, fill: palette.ink })}
    ${text(options.text.yearlyHeading, 82, 212, { size: 30, weight: 900, fill: palette.muted })}
    ${rect(764, 92, 236, 88, { fill: palette.paper, stroke: palette.line, radius: 44, opacity: 0.92 })}
    ${text(options.year, 882, 150, { size: 46, weight: 950, fill: palette.accent2, anchor: "middle" })}
    ${statCards}
    ${firstLatest}
    ${tickets}
    ${moreCount > 0 ? text(options.text.moreMemories(moreCount), 540, 1238, { size: 24, weight: 900, fill: palette.accent, anchor: "middle" }) : ""}
    ${options.privacy.showAttribution ? attribution(palette, options.text, options.language) : ""}
  `;

  return posterShell(content, palette, "yearly-report-poster-title");
};

export const getPosterFilename = (mode: "selected" | "yearly", year?: string, extension = "svg") =>
  mode === "yearly"
    ? `stagelog-${year ?? "yearly"}-report-poster.${extension}`
    : `stagelog-selected-events-poster.${extension}`;
