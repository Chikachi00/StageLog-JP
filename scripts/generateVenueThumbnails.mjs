import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_FILE = "src/data/venues.ts";
const LAYOUT_FILE = "src/data/venueThumbnailLayouts.ts";
const OUTPUT_DIR = "public/venue-thumbnails";

const categoryPalette = {
  dome: { bg: "#f8fbff", stroke: "#8ab6d6", fill: "#dff0fb", accent: "#f5c7aa" },
  arena: { bg: "#fbfcff", stroke: "#91a7d0", fill: "#e7ecfb", accent: "#b7e4d5" },
  hall: { bg: "#fffaf6", stroke: "#d5a66f", fill: "#faead7", accent: "#b7d7f0" },
  livehouse: { bg: "#fbf9ff", stroke: "#9b8fd5", fill: "#ebe5ff", accent: "#f3c0d3" },
  convention: { bg: "#f7fcf9", stroke: "#8bbfa1", fill: "#def3e7", accent: "#f6d783" },
  stadium: { bg: "#f7fbf8", stroke: "#7aac89", fill: "#ddefdf", accent: "#d7c08a" },
  theater: { bg: "#fff8fb", stroke: "#c78aa6", fill: "#f8ddec", accent: "#d9c2f0" },
  other: { bg: "#fafafa", stroke: "#9aa3ad", fill: "#eceff3", accent: "#dbe7f8" },
};

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const shortLabel = (name) => {
  const clean = name.replace(/\s*\([^)]*\)/g, "").trim();
  return clean.length > 27 ? `${clean.slice(0, 24)}...` : clean;
};

const base = (venue, body, layout) => {
  const palette = categoryPalette[venue.category] ?? categoryPalette.other;
  const description = layout
    ? `Project-owned schematic ${escapeXml(layout.shape)} venue thumbnail for StageLog JP. This is illustrative and not an official seat map.`
    : `Project-owned simplified ${escapeXml(venue.category)} venue thumbnail for StageLog JP.`;
  const typeLabel = layout ? layout.shape.replaceAll("-", " ").toUpperCase() : venue.category.toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(venue.name)} venue thumbnail</title>
  <desc id="desc">${description}</desc>
  <rect width="320" height="200" rx="22" fill="${palette.bg}"/>
  <rect x="10" y="10" width="300" height="180" rx="18" fill="white" stroke="${palette.stroke}" stroke-width="2" opacity="0.95"/>
  ${body(palette)}
  <text x="24" y="178" fill="#314057" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700">${escapeXml(shortLabel(venue.name))}</text>
  <text x="296" y="178" text-anchor="end" fill="#68758a" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700">${escapeXml(typeLabel)}</text>
</svg>
`;
};

const label = (x, y, text, size = 11) =>
  `<text x="${x}" y="${y}" text-anchor="middle" fill="#42526b" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="700">${text}</text>`;

const tierLines = (count = 1, startY = 88, step = 16, x1 = 92, x2 = 228) =>
  Array.from({ length: Math.max(0, count) }, (_, index) => {
    const y = startY + index * step;
    return `<path d="M${x1} ${y} H${x2}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.8"/>`;
  }).join("\n  ");

const layoutTemplates = {
  fan: (p, layout) => `
  <path d="M62 142 C91 72 122 43 160 36 C198 43 229 72 258 142 Z" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <path d="M86 132 C111 84 135 63 160 58 C185 63 209 84 234 132" fill="none" stroke="${p.stroke}" stroke-width="3"/>
  <path d="M104 118 C126 88 143 76 160 73 C177 76 194 88 216 118" fill="none" stroke="${p.stroke}" stroke-width="2"/>
  <path d="M123 103 C139 91 150 87 160 86 C170 87 181 91 197 103" fill="none" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="126" y="34" width="68" height="22" rx="7" fill="#314057"/>
  <path d="M123 134 H197 L184 151 H136 Z" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  ${label(160, 49, "STAGE", 10)}
  ${label(160, 146, "Arena Floor", 11)}
  ${label(160, 84, `${layout.tiers ?? 3} tiers`, 10)}
  `,
  "arena-rectangle": (p, layout) => `
  <rect x="56" y="40" width="208" height="112" rx="24" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <rect x="111" y="52" width="98" height="22" rx="7" fill="#314057"/>
  <rect x="96" y="88" width="128" height="48" rx="14" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  <path d="M70 78 h26 v62 h-26 z M224 78 h26 v62 h-26 z" fill="white" stroke="${p.stroke}" stroke-width="2" opacity="0.95"/>
  ${tierLines(layout.tiers ?? 2, 82, 16, 104, 216)}
  ${label(160, 67, "STAGE", 10)}
  ${label(160, 115, "Arena Floor", 12)}
  ${label(83, 112, "Stand", 9)}
  ${label(237, 112, "Stand", 9)}
  `,
  "arena-oval": (p, layout) => `
  <rect x="50" y="38" width="220" height="116" rx="54" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <rect x="74" y="54" width="172" height="86" rx="40" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="117" y="54" width="86" height="21" rx="7" fill="#314057"/>
  <rect x="108" y="92" width="124" height="34" rx="16" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  ${layout.hasOuterRing ? `<rect x="62" y="49" width="196" height="98" rx="47" fill="none" stroke="${p.stroke}" stroke-width="2" opacity="0.55"/>` : ""}
  ${tierLines(layout.tiers ?? 2, 86, 17, 100, 220)}
  ${label(160, 68, "STAGE", 10)}
  ${label(170, 114, "Arena Floor", 11)}
  `,
  dome: (p, layout) => `
  <ellipse cx="160" cy="94" rx="118" ry="66" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  ${layout.hasOuterRing ? `<ellipse cx="160" cy="94" rx="98" ry="52" fill="white" stroke="${p.stroke}" stroke-width="2" opacity="0.92"/>` : ""}
  <ellipse cx="160" cy="103" rx="69" ry="35" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="123" y="44" width="74" height="22" rx="7" fill="#314057"/>
  <path d="M83 94 C112 69 208 69 237 94" fill="none" stroke="${p.stroke}" stroke-width="3" opacity="0.7"/>
  <path d="M91 125 C122 147 198 147 229 125" fill="none" stroke="${p.stroke}" stroke-width="3" opacity="0.7"/>
  ${label(160, 59, "STAGE", 10)}
  ${label(160, 107, "Field / Arena", 12)}
  ${label(160, 151, `${layout.tiers ?? 2} ring stands`, 10)}
  `,
  "exhibition-hall": (p) => `
  <rect x="42" y="45" width="236" height="104" rx="12" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <rect x="58" y="61" width="62" height="72" rx="8" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="128" y="61" width="62" height="72" rx="8" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="198" y="61" width="62" height="72" rx="8" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="64" y="52" width="196" height="18" rx="6" fill="#314057"/>
  <rect x="81" y="104" width="158" height="24" rx="8" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  ${label(160, 66, "STAGE", 9)}
  ${label(89, 101, "Hall", 10)}
  ${label(159, 101, "Event", 10)}
  ${label(229, 101, "Hall", 10)}
  ${label(160, 122, "Flat Floor", 10)}
  `,
  livehouse: (p, layout) => `
  <rect x="66" y="42" width="188" height="108" rx="14" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <rect x="82" y="54" width="156" height="24" rx="7" fill="#314057"/>
  <rect x="92" y="91" width="136" height="47" rx="12" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  ${layout.hasSecondFloor ? `<path d="M82 84 H238" stroke="${p.stroke}" stroke-width="3"/><rect x="98" y="82" width="124" height="12" rx="5" fill="white" opacity="0.72"/>` : ""}
  <circle cx="109" cy="116" r="4" fill="white" opacity="0.9"/>
  <circle cx="136" cy="126" r="4" fill="white" opacity="0.9"/>
  <circle cx="164" cy="115" r="4" fill="white" opacity="0.9"/>
  <circle cx="193" cy="126" r="4" fill="white" opacity="0.9"/>
  <circle cx="216" cy="116" r="4" fill="white" opacity="0.9"/>
  ${label(160, 69, "STAGE", 10)}
  ${label(160, 119, "Standing", 12)}
  ${layout.hasSecondFloor ? label(160, 93, "2F", 9) : ""}
  `,
  hall: (p, layout) => `
  <rect x="85" y="38" width="150" height="28" rx="7" fill="#314057"/>
  <path d="M70 83 C112 60 208 60 250 83 L228 146 H92 Z" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  ${tierLines(layout.tiers ?? 2, 96, 19, 101, 219)}
  <rect x="108" y="133" width="104" height="16" rx="6" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  ${label(160, 56, "STAGE", 10)}
  ${label(160, 116, "Seats", 12)}
  ${label(160, 145, "Balcony", 9)}
  `,
};

const templates = {
  dome: (p) => `
  <ellipse cx="160" cy="91" rx="112" ry="62" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <ellipse cx="160" cy="91" rx="84" ry="42" fill="white" stroke="${p.stroke}" stroke-width="2" opacity="0.9"/>
  <path d="M160 58 L205 91 L160 124 L115 91 Z" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="128" y="33" width="64" height="20" rx="6" fill="#314057"/>
  ${label(160, 47, "Stage", 10)}
  ${label(160, 94, "Arena", 12)}
  ${label(160, 141, "Dome Stand", 11)}
  `,
  arena: (p) => `
  <rect x="58" y="42" width="204" height="102" rx="42" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <rect x="126" y="54" width="68" height="22" rx="7" fill="#314057"/>
  <rect x="102" y="84" width="116" height="42" rx="14" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  <path d="M70 76 h30 v56 h-30 z M220 76 h30 v56 h-30 z" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  ${label(160, 69, "Stage", 10)}
  ${label(160, 108, "Arena Floor", 12)}
  ${label(85, 107, "Stand", 10)}
  ${label(235, 107, "Stand", 10)}
  `,
  hall: (p) => `
  <rect x="78" y="35" width="164" height="30" rx="7" fill="#314057"/>
  <path d="M72 77 C116 55 204 55 248 77 L226 142 H94 Z" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <path d="M99 101 C132 86 188 86 221 101" fill="none" stroke="${p.stroke}" stroke-width="2"/>
  <path d="M91 126 H229" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="108" y="136" width="104" height="15" rx="6" fill="${p.accent}"/>
  ${label(160, 55, "Stage", 10)}
  ${label(160, 98, "1F Seats", 12)}
  ${label(160, 148, "Balcony", 10)}
  `,
  theater: (p) => `
  <rect x="92" y="34" width="136" height="30" rx="8" fill="#314057"/>
  <path d="M82 82 C116 66 204 66 238 82 L230 142 H90 Z" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <rect x="105" y="91" width="110" height="24" rx="10" fill="${p.accent}" opacity="0.85"/>
  <path d="M103 126 C135 116 185 116 217 126" fill="none" stroke="${p.stroke}" stroke-width="3"/>
  ${label(160, 54, "Stage", 10)}
  ${label(160, 108, "Seats", 12)}
  ${label(160, 132, "Balcony", 10)}
  `,
  livehouse: (p) => `
  <rect x="58" y="42" width="204" height="104" rx="16" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <rect x="82" y="52" width="156" height="24" rx="7" fill="#314057"/>
  <rect x="92" y="88" width="136" height="42" rx="12" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="64" y="115" width="26" height="20" rx="6" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="230" y="115" width="26" height="20" rx="6" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  ${label(160, 68, "Stage", 10)}
  ${label(160, 112, "Standing Floor", 12)}
  ${label(77, 129, "Bar", 9)}
  ${label(243, 129, "Entry", 9)}
  `,
  convention: (p) => `
  <rect x="48" y="42" width="224" height="106" rx="14" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <rect x="66" y="58" width="58" height="34" rx="7" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="132" y="58" width="58" height="34" rx="7" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="198" y="58" width="58" height="34" rx="7" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="76" y="106" width="168" height="26" rx="8" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  ${label(95, 78, "Hall A", 10)}
  ${label(161, 78, "Hall B", 10)}
  ${label(227, 78, "Hall C", 10)}
  ${label(160, 124, "Event Hall", 11)}
  `,
  stadium: (p) => `
  <ellipse cx="160" cy="92" rx="116" ry="60" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <ellipse cx="160" cy="92" rx="86" ry="42" fill="white" stroke="${p.stroke}" stroke-width="2"/>
  <path d="M122 78 h76 l22 28 h-120 z" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  <rect x="130" y="48" width="60" height="18" rx="6" fill="#314057"/>
  ${label(160, 62, "Stage", 9)}
  ${label(160, 99, "Field", 12)}
  ${label(160, 143, "Stands", 11)}
  `,
  other: (p) => `
  <rect x="62" y="44" width="196" height="98" rx="18" fill="${p.fill}" stroke="${p.stroke}" stroke-width="3"/>
  <rect x="102" y="56" width="116" height="24" rx="8" fill="#314057"/>
  <rect x="86" y="94" width="148" height="30" rx="12" fill="${p.accent}" stroke="${p.stroke}" stroke-width="2"/>
  ${label(160, 72, "Stage", 10)}
  ${label(160, 114, "Audience", 12)}
  `,
};

const parseVenueThumbnailLayouts = (source) => {
  const layouts = {};
  const recordMatch = source.match(/export const venueThumbnailLayouts[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
  const recordBody = recordMatch?.[1] ?? "";
  const layoutPattern = /"([^"]+)":\s*\{([\s\S]*?)\n\s*\},?/g;

  for (const match of recordBody.matchAll(layoutPattern)) {
    const [, id, block] = match;
    const layout = { venueId: id };
    const propertyPattern = /(\w+):\s*(?:"([^"]*)"|(\d+)|true|false)/g;

    for (const property of block.matchAll(propertyPattern)) {
      const key = property[1];
      const raw = property[0].slice(property[0].indexOf(":") + 1).trim();
      const stringValue = property[2];
      const numberValue = property[3];

      if (typeof stringValue === "string") {
        layout[key] = stringValue;
      } else if (typeof numberValue === "string") {
        layout[key] = Number(numberValue);
      } else if (raw.startsWith("true")) {
        layout[key] = true;
      } else if (raw.startsWith("false")) {
        layout[key] = false;
      }
    }

    layouts[id] = layout;
  }

  return layouts;
};

const parseVenues = (source) => {
  const venues = [];
  const objectPattern = /\{\s*id: "([^"]+)"[\s\S]*?\n\s*\},/g;

  for (const match of source.matchAll(objectPattern)) {
    const block = match[0];
    const id = match[1];
    const name = block.match(/name: "([^"]+)"/)?.[1] ?? id;
    const category = block.match(/category: "([^"]+)"/)?.[1] ?? "other";
    venues.push({ id, name, category: templates[category] ? category : "other" });
  }

  return venues;
};

const main = async () => {
  const source = await readFile(SOURCE_FILE, "utf8");
  const layoutSource = await readFile(LAYOUT_FILE, "utf8");
  const venues = parseVenues(source);
  const layouts = parseVenueThumbnailLayouts(layoutSource);
  const venueIds = new Set(venues.map((venue) => venue.id));
  const missingLayoutIds = Object.keys(layouts).filter((id) => !venueIds.has(id));
  await mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all(
    venues.map((venue) => {
      const layout = layouts[venue.id];
      const layoutTemplate = layout ? layoutTemplates[layout.shape] : undefined;
      const body = layoutTemplate
        ? (palette) => layoutTemplate(palette, layout)
        : templates[venue.category] ?? templates.other;
      const svg = base(venue, body, layout);
      return writeFile(path.join(OUTPUT_DIR, `${venue.id}.svg`), svg, "utf8");
    }),
  );

  if (missingLayoutIds.length > 0) {
    console.warn(`Skipped ${missingLayoutIds.length} thumbnail layouts with unknown venue ids: ${missingLayoutIds.join(", ")}`);
  }

  const schematicCount = venues.filter((venue) => layouts[venue.id]).length;
  console.log(`Generated ${venues.length} venue thumbnails in ${OUTPUT_DIR}`);
  console.log(`Used ${schematicCount} schematic venue thumbnail layouts`);
};

await main();
