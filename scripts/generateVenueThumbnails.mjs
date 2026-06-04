import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_FILE = "src/data/venues.ts";
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

const base = (venue, body) => {
  const palette = categoryPalette[venue.category] ?? categoryPalette.other;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(venue.name)} venue thumbnail</title>
  <desc id="desc">Project-owned simplified ${escapeXml(venue.category)} venue thumbnail for StageLog JP.</desc>
  <rect width="320" height="200" rx="22" fill="${palette.bg}"/>
  <rect x="10" y="10" width="300" height="180" rx="18" fill="white" stroke="${palette.stroke}" stroke-width="2" opacity="0.95"/>
  ${body(palette)}
  <text x="24" y="178" fill="#314057" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700">${escapeXml(shortLabel(venue.name))}</text>
  <text x="296" y="178" text-anchor="end" fill="#68758a" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700">${escapeXml(venue.category.toUpperCase())}</text>
</svg>
`;
};

const label = (x, y, text, size = 11) =>
  `<text x="${x}" y="${y}" text-anchor="middle" fill="#42526b" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="700">${text}</text>`;

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

const parseVenues = (source) => {
  const venues = [];
  const objectPattern = /\{\s*id: "([^"]+)"[\s\S]*?supportedSeatMap: (?:true|false),?\s*\}/g;

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
  const venues = parseVenues(source);
  await mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all(
    venues.map((venue) => {
      const svg = base(venue, templates[venue.category] ?? templates.other);
      return writeFile(path.join(OUTPUT_DIR, `${venue.id}.svg`), svg, "utf8");
    }),
  );

  console.log(`Generated ${venues.length} venue thumbnails in ${OUTPUT_DIR}`);
};

await main();
