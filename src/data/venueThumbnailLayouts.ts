export type VenueThumbnailAccuracy = "generic" | "schematic" | "verified";

export type VenueThumbnailShape =
  | "arena-fan"
  | "arena-rectangle"
  | "dome-oval"
  | "exhibition-hall"
  | "livehouse"
  | "theater"
  | "hall"
  | "stadium"
  | "convention"
  | "generic";

export type VenueThumbnailStagePosition =
  | "end"
  | "center"
  | "side"
  | "none";

export interface VenueThumbnailLayout {
  venueId: string;
  accuracy: VenueThumbnailAccuracy;
  shape: VenueThumbnailShape;
  stagePosition: VenueThumbnailStagePosition;
  tiers?: number;
  hasArenaFloor?: boolean;
  hasSecondFloor?: boolean;
  hasOuterRing?: boolean;
  hasStandingArea?: boolean;
  notes?: string;
}

export const venueThumbnailLayouts: Record<string, VenueThumbnailLayout> = {
  "k-arena-yokohama": {
    venueId: "k-arena-yokohama",
    accuracy: "schematic",
    shape: "arena-fan",
    stagePosition: "end",
    tiers: 4,
    hasArenaFloor: true,
    hasSecondFloor: true,
    notes: "Simplified arena-fan schematic, not official seat map. Needs manual reference before any verified status.",
  },
  "pia-arena-mm": {
    venueId: "pia-arena-mm",
    accuracy: "schematic",
    shape: "arena-rectangle",
    stagePosition: "end",
    tiers: 3,
    hasArenaFloor: true,
    hasSecondFloor: true,
    notes: "Simplified rectangular arena schematic, not official seat map. Needs manual reference before any verified status.",
  },
  "yokohama-arena": {
    venueId: "yokohama-arena",
    accuracy: "schematic",
    shape: "arena-rectangle",
    stagePosition: "end",
    tiers: 3,
    hasArenaFloor: true,
    hasOuterRing: true,
    notes: "Simplified rectangular arena schematic with outer ring hint, not official seat map. Needs manual reference before any verified status.",
  },
  "ariake-arena": {
    venueId: "ariake-arena",
    accuracy: "schematic",
    shape: "arena-rectangle",
    stagePosition: "end",
    tiers: 3,
    hasArenaFloor: true,
    hasSecondFloor: true,
    notes: "Simplified rectangular arena schematic, not official seat map. Needs manual reference before any verified status.",
  },
  "belluna-dome": {
    venueId: "belluna-dome",
    accuracy: "schematic",
    shape: "dome-oval",
    stagePosition: "end",
    tiers: 2,
    hasArenaFloor: true,
    hasOuterRing: true,
    notes: "Simplified dome-oval schematic, not official seat map. Needs manual reference before any verified status.",
  },
  "tokyo-dome": {
    venueId: "tokyo-dome",
    accuracy: "schematic",
    shape: "dome-oval",
    stagePosition: "end",
    tiers: 2,
    hasArenaFloor: true,
    hasOuterRing: true,
    notes: "Simplified dome-oval schematic, not official seat map. Needs manual reference before any verified status.",
  },
  "makuhari-messe": {
    venueId: "makuhari-messe",
    accuracy: "schematic",
    shape: "exhibition-hall",
    stagePosition: "end",
    tiers: 1,
    hasArenaFloor: true,
    notes: "Simplified exhibition-hall schematic, not official seat map. Exact hall/event setup needs manual reference.",
  },
  "zepp-haneda": {
    venueId: "zepp-haneda",
    accuracy: "schematic",
    shape: "livehouse",
    stagePosition: "end",
    tiers: 1,
    hasArenaFloor: true,
    hasStandingArea: true,
    hasSecondFloor: true,
    notes: "Simplified livehouse schematic with standing area, not official seat map. Second-floor detail needs manual reference.",
  },
  "zepp-divercity-tokyo": {
    venueId: "zepp-divercity-tokyo",
    accuracy: "schematic",
    shape: "livehouse",
    stagePosition: "end",
    tiers: 1,
    hasArenaFloor: true,
    hasStandingArea: true,
    hasSecondFloor: true,
    notes: "Simplified livehouse schematic with standing area, not official seat map. Second-floor detail needs manual reference.",
  },
  "zepp-shinjuku-tokyo": {
    venueId: "zepp-shinjuku-tokyo",
    accuracy: "schematic",
    shape: "livehouse",
    stagePosition: "end",
    tiers: 1,
    hasArenaFloor: true,
    hasStandingArea: true,
    hasSecondFloor: true,
    notes: "Simplified livehouse schematic with standing area, not official seat map. Second-floor detail needs manual reference.",
  },
  "kt-zepp-yokohama": {
    venueId: "kt-zepp-yokohama",
    accuracy: "schematic",
    shape: "livehouse",
    stagePosition: "end",
    tiers: 1,
    hasArenaFloor: true,
    hasStandingArea: true,
    hasSecondFloor: true,
    notes: "Simplified livehouse schematic with standing area, not official seat map. Second-floor detail needs manual reference.",
  },
};
