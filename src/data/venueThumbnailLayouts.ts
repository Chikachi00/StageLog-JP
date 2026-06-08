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

export type VenueThumbnailRefinement = "v1" | "v2";

export type VenueThumbnailVisualVariant =
  | "k-arena-yokohama-v2"
  | "tokyo-dome-v2"
  | "belluna-dome-v2"
  | "pia-arena-mm-v2"
  | "yokohama-arena-v2"
  | "ariake-arena-v2"
  | "makuhari-messe-v2"
  | "zepp-haneda-v2";

export interface VenueThumbnailLayout {
  venueId: string;
  accuracy: VenueThumbnailAccuracy;
  shape: VenueThumbnailShape;
  stagePosition: VenueThumbnailStagePosition;
  refinement?: VenueThumbnailRefinement;
  visualVariant?: VenueThumbnailVisualVariant;
  tiers?: number;
  hasArenaFloor?: boolean;
  hasSecondFloor?: boolean;
  hasOuterRing?: boolean;
  hasStandingArea?: boolean;
  fanSpread?: number;
  seatCurveStrength?: number;
  sideStandWidth?: number;
  floorWidthRatio?: number;
  outerRingThickness?: number;
  balconyDepth?: number;
  cornerRoundness?: number;
  notes?: string;
}

export const venueThumbnailLayouts: Record<string, VenueThumbnailLayout> = {
  "k-arena-yokohama": {
    venueId: "k-arena-yokohama",
    accuracy: "schematic",
    shape: "arena-fan",
    stagePosition: "end",
    refinement: "v2",
    visualVariant: "k-arena-yokohama-v2",
    tiers: 4,
    hasArenaFloor: true,
    hasSecondFloor: true,
    fanSpread: 92,
    seatCurveStrength: 4,
    floorWidthRatio: 54,
    notes: "V2 manually refined fan-shaped schematic, not official seat map. Needs manual reference before any verified status.",
  },
  "pia-arena-mm": {
    venueId: "pia-arena-mm",
    accuracy: "schematic",
    shape: "arena-rectangle",
    stagePosition: "end",
    refinement: "v2",
    visualVariant: "pia-arena-mm-v2",
    tiers: 3,
    hasArenaFloor: true,
    hasSecondFloor: true,
    sideStandWidth: 24,
    floorWidthRatio: 62,
    cornerRoundness: 18,
    notes: "V2 manually refined clean rectangular arena schematic, not official seat map. Needs manual reference before any verified status.",
  },
  "yokohama-arena": {
    venueId: "yokohama-arena",
    accuracy: "schematic",
    shape: "arena-rectangle",
    stagePosition: "end",
    refinement: "v2",
    visualVariant: "yokohama-arena-v2",
    tiers: 3,
    hasArenaFloor: true,
    hasOuterRing: true,
    sideStandWidth: 34,
    floorWidthRatio: 52,
    outerRingThickness: 18,
    cornerRoundness: 34,
    notes: "V2 manually refined compact bowl-style arena schematic, not official seat map. Needs manual reference before any verified status.",
  },
  "ariake-arena": {
    venueId: "ariake-arena",
    accuracy: "schematic",
    shape: "arena-rectangle",
    stagePosition: "end",
    refinement: "v2",
    visualVariant: "ariake-arena-v2",
    tiers: 3,
    hasArenaFloor: true,
    hasSecondFloor: true,
    sideStandWidth: 30,
    floorWidthRatio: 58,
    cornerRoundness: 24,
    notes: "V2 manually refined balanced side-stand arena schematic, not official seat map. Needs manual reference before any verified status.",
  },
  "belluna-dome": {
    venueId: "belluna-dome",
    accuracy: "schematic",
    shape: "dome-oval",
    stagePosition: "end",
    refinement: "v2",
    visualVariant: "belluna-dome-v2",
    tiers: 2,
    hasArenaFloor: true,
    hasOuterRing: true,
    outerRingThickness: 18,
    floorWidthRatio: 58,
    notes: "V2 manually refined oval dome schematic with distinct ring proportions, not official seat map. Needs manual reference before any verified status.",
  },
  "tokyo-dome": {
    venueId: "tokyo-dome",
    accuracy: "schematic",
    shape: "dome-oval",
    stagePosition: "end",
    refinement: "v2",
    visualVariant: "tokyo-dome-v2",
    tiers: 2,
    hasArenaFloor: true,
    hasOuterRing: true,
    outerRingThickness: 22,
    floorWidthRatio: 64,
    notes: "V2 manually refined wide oval dome schematic, not official seat map. Needs manual reference before any verified status.",
  },
  "makuhari-messe": {
    venueId: "makuhari-messe",
    accuracy: "schematic",
    shape: "exhibition-hall",
    stagePosition: "end",
    refinement: "v2",
    visualVariant: "makuhari-messe-v2",
    tiers: 1,
    hasArenaFloor: true,
    floorWidthRatio: 82,
    cornerRoundness: 8,
    notes: "V2 manually refined flat exhibition hall schematic, not official seat map. Exact hall/event setup needs manual reference.",
  },
  "zepp-haneda": {
    venueId: "zepp-haneda",
    accuracy: "schematic",
    shape: "livehouse",
    stagePosition: "end",
    refinement: "v2",
    visualVariant: "zepp-haneda-v2",
    tiers: 1,
    hasArenaFloor: true,
    hasStandingArea: true,
    hasSecondFloor: true,
    balconyDepth: 18,
    floorWidthRatio: 70,
    notes: "V2 manually refined compact livehouse schematic with standing floor and rear balcony hint, not official seat map. Second-floor detail needs manual reference.",
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
