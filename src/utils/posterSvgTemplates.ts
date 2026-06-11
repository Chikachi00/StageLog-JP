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
  backgroundGlow: string;
  card: string;
  cardAlt: string;
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
  border: string;
  badgeBg: string;
  barcode: string;
  footerBg: string;
  shadow: string;
}

interface TextOptions {
  size?: number;
  weight?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  opacity?: number;
  transform?: string;
  family?: string;
  lineHeight?: number;
  letterSpacing?: number;
}

interface TicketDrawOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  total: number;
  variant: "large" | "medium" | "compact" | "report";
  palette: PosterThemePalette;
  templateOptions: SharePosterTemplateOptions;
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

const fontStack = "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const monoStack = "Consolas, SFMono-Regular, ui-monospace, monospace";

const palettes: Record<SharePosterTheme, PosterThemePalette> = {
  sakura: {
    background: "#fff8fb",
    backgroundGlow: "#ffdbe9",
    card: "#fffdfd",
    cardAlt: "#fff2f7",
    ink: "#2f2430",
    muted: "#745d6c",
    accent: "#df4b78",
    accent2: "#8e5aa9",
    border: "#ecd3df",
    badgeBg: "#fff0f6",
    barcode: "#7d5364",
    footerBg: "#ffffff",
    shadow: "#d94f7a24",
  },
  ocean: {
    background: "#f2fbfd",
    backgroundGlow: "#d7f3f7",
    card: "#ffffff",
    cardAlt: "#eff9fc",
    ink: "#122637",
    muted: "#547184",
    accent: "#0f7c92",
    accent2: "#285dc8",
    border: "#c9e1ea",
    badgeBg: "#e9f7fb",
    barcode: "#426174",
    footerBg: "#ffffff",
    shadow: "#0f7c9224",
  },
  night: {
    background: "#07101f",
    backgroundGlow: "#1f2b4a",
    card: "#151f32",
    cardAlt: "#101929",
    ink: "#f0f4ff",
    muted: "#aab5c8",
    accent: "#8aa2ff",
    accent2: "#5de0d0",
    border: "#34445d",
    badgeBg: "#1d2a42",
    barcode: "#d6dded",
    footerBg: "#101929",
    shadow: "#00000045",
  },
  classic: {
    background: "#faf8f3",
    backgroundGlow: "#ede4d6",
    card: "#fffdf8",
    cardAlt: "#f4efe6",
    ink: "#272727",
    muted: "#66615b",
    accent: "#4e5f77",
    accent2: "#2d7d7a",
    border: "#ddd6ca",
    badgeBg: "#f3ede2",
    barcode: "#4b5563",
    footerBg: "#fffdf8",
    shadow: "#4e5f7724",
  },
};

export const escapeSvgText = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const sanitizeSvgInput = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

export const truncateText = (value: unknown, maxChars: number) => {
  const textValue = sanitizeSvgInput(value);

  if (textValue.length <= maxChars) {
    return textValue;
  }

  return `${textValue.slice(0, Math.max(1, maxChars - 3)).trimEnd()}...`;
};

const splitLongToken = (token: string, maxChars: number) => {
  const chars = Array.from(token);
  const chunks: string[] = [];

  for (let index = 0; index < chars.length; index += maxChars) {
    chunks.push(chars.slice(index, index + maxChars).join(""));
  }

  return chunks;
};

export const wrapTextByChars = (value: unknown, maxCharsPerLine: number, maxLines: number) => {
  const textValue = sanitizeSvgInput(value);

  if (!textValue) {
    return [];
  }

  const hasSpaces = /\s/.test(textValue);
  const units = hasSpaces
    ? textValue
        .split(/\s+/)
        .flatMap((token) => (Array.from(token).length > maxCharsPerLine ? splitLongToken(token, maxCharsPerLine) : token))
    : splitLongToken(textValue, maxCharsPerLine);

  const lines: string[] = [];
  let current = "";

  units.forEach((unit) => {
    const next = current ? `${current}${hasSpaces ? " " : ""}${unit}` : unit;

    if (Array.from(next).length <= maxCharsPerLine) {
      current = next;
      return;
    }

    if (current) {
      lines.push(current);
    }
    current = unit;
  });

  if (current) {
    lines.push(current);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const clamped = lines.slice(0, maxLines);
  clamped[maxLines - 1] = truncateText(clamped[maxLines - 1], Math.max(4, maxCharsPerLine));
  return clamped;
};

const renderSvgTextLines = (lines: string[], x: number, y: number, options: TextOptions = {}) => {
  if (lines.length === 0) {
    return "";
  }

  const lineHeight = options.lineHeight ?? (options.size ?? 24) * 1.18;
  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `fill="${options.fill ?? "currentColor"}"`,
    `font-family="${options.family ?? fontStack}"`,
    `font-size="${options.size ?? 24}"`,
    `font-weight="${options.weight ?? 700}"`,
    `text-anchor="${options.anchor ?? "start"}"`,
    options.opacity ? `opacity="${options.opacity}"` : "",
    options.transform ? `transform="${options.transform}"` : "",
    options.letterSpacing !== undefined ? `letter-spacing="${options.letterSpacing}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const tspans = lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeSvgText(line)}</tspan>`)
    .join("");

  return `<text ${attrs}>${tspans}</text>`;
};

const text = (value: unknown, x: number, y: number, options: TextOptions = {}) =>
  renderSvgTextLines([sanitizeSvgInput(value)], x, y, options);

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

const hashString = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createPosterBarcode = (seed: string, x: number, y: number, width: number, height: number, color: string) => {
  const hash = hashString(seed);
  const barCount = 12 + (hash % 7);
  let cursor = x;
  const bars: string[] = [];

  for (let index = 0; index < barCount; index += 1) {
    const stepHash = hashString(`${seed}-${index}`);
    const barWidth = 1.5 + (stepHash % 4) * 0.65;
    const gap = 2 + ((stepHash >>> 3) % 3) * 0.45;
    const barHeight = height - ((stepHash >>> 5) % 5) * 3;
    const yOffset = (height - barHeight) / 2;

    if (cursor + barWidth > x + width) {
      break;
    }

    bars.push(rect(cursor, y + yOffset, barWidth, barHeight, { fill: color, radius: 1, opacity: 0.46 }));
    cursor += barWidth + gap;
  }

  return bars.join("");
};

const getTimeLine = (event: EventRecord, labels: SharePosterText) => {
  const doors = event.doorsOpenTime ? `${labels.doors} ${event.doorsOpenTime.slice(0, 5)}` : "";
  const start = event.startTime ? `${labels.start} ${event.startTime.slice(0, 5)}` : "";
  return [doors, start].filter(Boolean).join(" / ");
};

const getOptionalEventBadges = (
  event: EventRecord,
  privacy: SharePosterPrivacyOptions,
  labels: SharePosterText,
  compact: boolean,
) => {
  const badges: string[] = [];
  const timeLine = getTimeLine(event, labels);

  if (timeLine) {
    badges.push(timeLine);
  }

  if (privacy.showWeather && event.weather) {
    badges.push(`${labels.weather} ${event.weather.temperature.toFixed(1)} C`);
  }

  if (privacy.showTicketType && event.ticketType && !compact) {
    badges.push(`${labels.ticketType} ${truncateText(event.ticketType, 18)}`);
  }

  if (privacy.showSeat && !compact) {
    const seat = getSeatSummary(event);

    if (seat) {
      badges.push(`${labels.seat} ${truncateText(seat, 22)}`);
    }
  }

  if (privacy.showNotes && event.notes && !compact) {
    badges.push(`${labels.notes} ${truncateText(event.notes, 24)}`);
  }

  return badges.slice(0, compact ? 2 : 3);
};

const renderBadgeRow = (badges: string[], x: number, y: number, maxWidth: number, palette: PosterThemePalette, compact: boolean) => {
  let cursor = x;
  const badgeHeight = compact ? 24 : 28;
  const fontSize = compact ? 11 : 12;
  const parts: string[] = [];

  badges.forEach((badge) => {
    const label = truncateText(badge, compact ? 20 : 24);
    const width = Math.min(maxWidth, Math.max(54, Array.from(label).length * (compact ? 6.4 : 7.2) + 22));

    if (cursor + width > x + maxWidth) {
      return;
    }

    parts.push(rect(cursor, y, width, badgeHeight, { fill: palette.badgeBg, stroke: palette.border, radius: badgeHeight / 2, opacity: 0.96 }));
    parts.push(text(label, cursor + width / 2, y + badgeHeight - 8, { size: fontSize, weight: 800, fill: palette.muted, anchor: "middle" }));
    cursor += width + 8;
  });

  return parts.join("");
};

const getTicketTypography = (variant: TicketDrawOptions["variant"]) => {
  if (variant === "large") {
    return { title: 25, date: 15, meta: 15, venue: 13, titleChars: 26, venueChars: 42, artistChars: 32, badgeCompact: false };
  }

  if (variant === "medium") {
    return { title: 20, date: 13, meta: 13, venue: 12, titleChars: 21, venueChars: 34, artistChars: 26, badgeCompact: false };
  }

  if (variant === "report") {
    return { title: 16, date: 11, meta: 11, venue: 10, titleChars: 18, venueChars: 28, artistChars: 24, badgeCompact: true };
  }

  return { title: 16, date: 11, meta: 11, venue: 10, titleChars: 17, venueChars: 28, artistChars: 22, badgeCompact: true };
};

const renderTicketStub = (event: EventRecord, draw: TicketDrawOptions) => {
  const { x, y, width, height, index, total, variant, palette, templateOptions } = draw;
  const stubWidth = variant === "large" ? 112 : variant === "medium" ? 88 : 82;
  const padding = variant === "large" ? 22 : 16;
  const mainWidth = width - stubWidth;
  const contentWidth = mainWidth - padding * 2;
  const stubX = x + mainWidth;
  const type = getTicketTypography(variant);
  const compact = type.badgeCompact;
  const titleLines = wrapTextByChars(event.title, type.titleChars, 2);
  const artist = truncateText(event.artist, type.artistChars);
  const venueLabel = truncateText([event.venueName, getEventLocationLabel(event)].filter(Boolean).join(" / "), type.venueChars);
  const badges = getOptionalEventBadges(event, templateOptions.privacy, templateOptions.text, compact);
  const code = getEventCode(event).replace(/^SL-/, "");
  const clipId = `ticketClip${index}-${hashString(`${event.id}-${event.date}`)}`;
  const stubClipId = `ticketStubClip${index}-${hashString(`${event.title}-${event.date}`)}`;
  const titleY = y + (variant === "large" ? 86 : variant === "medium" ? 65 : 55);
  const lineHeight = variant === "large" ? 30 : variant === "medium" ? 24 : 20;
  const artistY = titleY + lineHeight * Math.max(1, titleLines.length) + (variant === "large" ? 18 : 11);
  const venueY = artistY + (variant === "large" ? 24 : 18);
  const badgeY = Math.min(y + height - (compact ? 34 : 42), venueY + (variant === "large" ? 22 : 18));
  const barcodeWidth = variant === "large" ? 58 : 52;
  const barcodeHeight = variant === "large" ? 66 : 52;
  const barcodeX = stubX + (stubWidth - barcodeWidth) / 2;
  const barcodeY = y + (height - barcodeHeight) / 2 - (variant === "compact" ? 6 : 12);

  return `
    <clipPath id="${clipId}">${rect(x, y, width, height, { fill: "#fff", radius: 24 })}</clipPath>
    <clipPath id="${stubClipId}">${rect(stubX + 1, y + 16, stubWidth - 2, height - 32, { fill: "#fff", radius: 16 })}</clipPath>
    <g>
      ${rect(x + 7, y + 9, width, height, { fill: palette.shadow, radius: 24, opacity: 0.9 })}
      ${rect(x, y, width, height, { fill: palette.card, stroke: palette.border, radius: 24, strokeWidth: 2 })}
      ${rect(x, y, 8, height, { fill: palette.accent, radius: 24, opacity: 0.94 })}
      <line x1="${stubX}" y1="${y + 18}" x2="${stubX}" y2="${y + height - 18}" stroke="${palette.border}" stroke-width="2.4" stroke-dasharray="7 9"/>
      ${circle(stubX, y, 11, palette.background)}
      ${circle(stubX, y + height, 11, palette.background)}
      <g clip-path="url(#${clipId})">
        ${text(formatPosterDate(event.date), x + padding + 8, y + (variant === "large" ? 43 : 34), {
          size: type.date,
          weight: 900,
          fill: palette.accent,
          letterSpacing: 1.1,
        })}
        ${renderSvgTextLines(titleLines, x + padding + 8, titleY, {
          size: type.title,
          weight: 950,
          fill: palette.ink,
          lineHeight,
        })}
        ${text(artist, x + padding + 8, artistY, { size: type.meta, weight: 850, fill: palette.accent2 })}
        ${text(venueLabel, x + padding + 8, venueY, { size: type.venue, weight: 780, fill: palette.muted })}
        ${renderBadgeRow(badges, x + padding + 8, badgeY, contentWidth, palette, compact)}
      </g>
      <g clip-path="url(#${stubClipId})">
        ${createPosterBarcode(`${event.id}-${event.title}-${event.date}`, barcodeX, barcodeY, barcodeWidth, barcodeHeight, palette.barcode)}
        ${text(`${String(index + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`, stubX + stubWidth / 2, y + height - 30, {
          size: variant === "large" ? 18 : 14,
          weight: 950,
          fill: palette.accent,
          anchor: "middle",
          family: monoStack,
        })}
        ${text(code.slice(0, 8), stubX + stubWidth / 2, y + height - 12, {
          size: variant === "large" ? 10 : 8,
          weight: 850,
          fill: palette.muted,
          anchor: "middle",
          family: monoStack,
        })}
      </g>
    </g>
  `;
};

const posterShell = (content: string, palette: PosterThemePalette, titleId: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}" role="img" aria-labelledby="${titleId}">
  <title id="${titleId}">StageLog JP Share Poster</title>
  <defs>
    <radialGradient id="posterGlowA" cx="16%" cy="7%" r="72%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.22"/>
      <stop offset="66%" stop-color="${palette.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="posterGlowB" cx="92%" cy="10%" r="70%">
      <stop offset="0%" stop-color="${palette.accent2}" stop-opacity="0.18"/>
      <stop offset="64%" stop-color="${palette.accent2}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="posterBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.background}"/>
      <stop offset="100%" stop-color="${palette.backgroundGlow}"/>
    </linearGradient>
  </defs>
  ${rect(0, 0, POSTER_WIDTH, POSTER_HEIGHT, { fill: "url(#posterBg)" })}
  <rect width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" fill="url(#posterGlowA)"/>
  <rect width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" fill="url(#posterGlowB)"/>
  ${Array.from({ length: 34 }, (_, index) => circle(64 + (index % 9) * 118, 1070 + Math.floor(index / 9) * 54, 2.2, palette.border, 0.38)).join("")}
  ${content}
</svg>
`;

const attribution = (palette: PosterThemePalette, labels: SharePosterText) => `
  ${rect(82, 1262, 916, 50, { fill: palette.footerBg, stroke: palette.border, radius: 25, opacity: 0.92 })}
  ${text(`${labels.generatedBy} / ${STAGELOG_GITHUB_URL.replace("https://", "")}`, 540, 1294, {
    size: 18,
    weight: 850,
    fill: palette.muted,
    anchor: "middle",
  })}
`;

const getSelectedTicketGrid = (count: number) => {
  if (count <= 1) {
    return { columns: 1, width: 860, height: 310, gapX: 0, gapY: 0, startX: 110, startY: 390, variant: "large" as const };
  }

  if (count <= 2) {
    return { columns: 1, width: 860, height: 245, gapX: 0, gapY: 34, startX: 110, startY: 320, variant: "large" as const };
  }

  if (count <= 4) {
    return { columns: 2, width: 420, height: 238, gapX: 28, gapY: 32, startX: 106, startY: 310, variant: "large" as const };
  }

  if (count <= 8) {
    return { columns: 2, width: 420, height: 148, gapX: 28, gapY: 22, startX: 106, startY: 292, variant: "medium" as const };
  }

  return { columns: 2, width: 420, height: 118, gapX: 28, gapY: 16, startX: 106, startY: 286, variant: "compact" as const };
};

export const generateSelectedEventsPosterSvg = (
  selectedEvents: EventRecord[],
  options: SharePosterTemplateOptions,
) => {
  const palette = palettes[options.theme];
  const events = sortPosterEvents(selectedEvents).slice(0, 12);
  const grid = getSelectedTicketGrid(events.length);
  const dateRange = getPosterDateRange(events);
  const countLabel = `${events.length} ${options.text.liveEvents}`;

  const tickets = events
    .map((event, index) => {
      const column = index % grid.columns;
      const row = Math.floor(index / grid.columns);
      return renderTicketStub(event, {
        x: grid.startX + column * (grid.width + grid.gapX),
        y: grid.startY + row * (grid.height + grid.gapY),
        width: grid.width,
        height: grid.height,
        index,
        total: events.length,
        variant: grid.variant,
        palette,
        templateOptions: options,
      });
    })
    .join("");

  const content = `
    ${text("StageLog JP", 82, 92, { size: 28, weight: 950, fill: palette.accent, letterSpacing: 1.3 })}
    ${renderSvgTextLines(wrapTextByChars(options.text.selectedHeading, 28, 2), 82, 158, {
      size: 56,
      weight: 950,
      fill: palette.ink,
      lineHeight: 60,
    })}
    ${text(options.text.selectedSubtitle, 82, 232, { size: 23, weight: 850, fill: palette.muted })}
    ${rect(724, 84, 276, 112, { fill: palette.card, stroke: palette.border, radius: 36, opacity: 0.94 })}
    ${text(dateRange || "MEMORIES", 862, 126, { size: 28, weight: 950, fill: palette.accent2, anchor: "middle" })}
    ${text(countLabel, 862, 164, { size: 18, weight: 850, fill: palette.muted, anchor: "middle" })}
    ${rect(82, 252, 916, 2, { fill: palette.border, opacity: 0.82 })}
    ${tickets}
    ${options.privacy.showAttribution ? attribution(palette, options.text) : ""}
  `;

  return posterShell(content, palette, "selected-events-poster-title");
};

const renderStatCard = (
  label: string,
  value: string | number,
  x: number,
  y: number,
  width: number,
  palette: PosterThemePalette,
  alternate = false,
) => `
  ${rect(x, y, width, 118, { fill: alternate ? palette.cardAlt : palette.card, stroke: palette.border, radius: 28, opacity: 0.95 })}
  ${text(label, x + 24, y + 34, { size: 17, weight: 850, fill: palette.muted })}
  ${text(value, x + 24, y + 88, { size: 48, weight: 950, fill: alternate ? palette.accent2 : palette.accent })}
`;

const renderInsightPill = (label: string, value: string, x: number, y: number, width: number, palette: PosterThemePalette) => `
  ${rect(x, y, width, 58, { fill: palette.card, stroke: palette.border, radius: 22, opacity: 0.92 })}
  ${text(label, x + 20, y + 23, { size: 12, weight: 850, fill: palette.muted })}
  ${text(truncateText(value, Math.max(18, Math.floor(width / 11))), x + 20, y + 45, { size: 15, weight: 900, fill: palette.ink })}
`;

export const generateYearlyReportPosterSvg = (
  eventsInYear: EventRecord[],
  options: YearlyReportPosterOptions,
) => {
  const palette = palettes[options.theme];
  const sortedEvents = sortPosterEvents(eventsInYear);
  const visibleEvents = sortedEvents.slice(0, 8);
  const moreCount = Math.max(0, eventsInYear.length - visibleEvents.length);
  const stats = buildYearlySharePosterStats(eventsInYear, options.ticketApplications, options.year, options.text.noData);
  const compactOptions = { ...options, privacy: { ...options.privacy, showNotes: false, showSeat: false } };
  const dateRange = getPosterDateRange(eventsInYear) || options.year;

  const statCards = [
    renderStatCard(options.text.liveEvents, stats.eventCount, 82, 260, 214, palette),
    renderStatCard(options.text.unlockedCities, stats.cityCount, 316, 260, 214, palette, true),
    renderStatCard(options.text.unlockedVenues, stats.venueCount, 550, 260, 214, palette),
    renderStatCard(options.text.ticketRounds, stats.ticketRoundCount, 784, 260, 214, palette, true),
  ].join("");

  const insightCards = [
    renderInsightPill(options.text.mostVisitedCity, stats.mostVisitedCity, 82, 410, 284, palette),
    renderInsightPill(options.text.mostVisitedVenue, stats.mostVisitedVenue, 398, 410, 284, palette),
    renderInsightPill(
      options.privacy.showPrice ? options.text.price : options.text.weatherRecords,
      options.privacy.showPrice ? stats.paidSpendingLabel : String(stats.weatherRecordCount),
      714,
      410,
      284,
      palette,
    ),
    stats.firstLive
      ? renderInsightPill(options.text.firstLive, `${formatPosterDate(stats.firstLive.date)} / ${stats.firstLive.title}`, 82, 484, 442, palette)
      : "",
    stats.latestLive
      ? renderInsightPill(options.text.latestLive, `${formatPosterDate(stats.latestLive.date)} / ${stats.latestLive.title}`, 556, 484, 442, palette)
      : "",
  ].join("");

  const tickets = visibleEvents
    .map((event, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      return renderTicketStub(event, {
        x: 106 + column * 448,
        y: 610 + row * 135,
        width: 420,
        height: 118,
        index,
        total: visibleEvents.length,
        variant: "report",
        palette,
        templateOptions: compactOptions,
      });
    })
    .join("");

  const content = `
    ${text("StageLog JP", 82, 92, { size: 28, weight: 950, fill: palette.accent, letterSpacing: 1.3 })}
    ${text(`${options.year} LIVE`, 82, 166, { size: 76, weight: 950, fill: palette.ink })}
    ${text(options.text.yearlyHeading, 82, 220, { size: 28, weight: 900, fill: palette.muted })}
    ${rect(756, 90, 242, 96, { fill: palette.card, stroke: palette.border, radius: 44, opacity: 0.94 })}
    ${text(dateRange, 877, 151, { size: 36, weight: 950, fill: palette.accent2, anchor: "middle" })}
    ${statCards}
    ${insightCards}
    ${tickets}
    ${moreCount > 0 ? text(options.text.moreMemories(moreCount), 540, 1188, { size: 24, weight: 950, fill: palette.accent, anchor: "middle" }) : ""}
    ${options.privacy.showAttribution ? attribution(palette, options.text) : ""}
  `;

  return posterShell(content, palette, "yearly-report-poster-title");
};

export const getPosterFilename = (mode: "selected" | "yearly", year?: string, extension = "svg") =>
  mode === "yearly"
    ? `stagelog-${year ?? "yearly"}-report-poster.${extension}`
    : `stagelog-selected-events-poster.${extension}`;
