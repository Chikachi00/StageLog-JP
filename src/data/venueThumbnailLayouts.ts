export type VenueThumbnailAccuracy = "generic" | "schematic" | "verified";

export type VenueThumbnailShape =
  | "arena-oval"
  | "arena-rectangle"
  | "fan"
  | "dome"
  | "exhibition-hall"
  | "livehouse"
  | "hall";

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
  notes?: string;
}

export const venueThumbnailLayouts: Record<string, VenueThumbnailLayout> = {
  "k-arena-yokohama": {
    venueId: "k-arena-yokohama",
    accuracy: "schematic",
    shape: "fan",
    stagePosition: "end",
    tiers: 3,
    hasArenaFloor: true,
    hasSecondFloor: true,
    notes: "Fan-like concert hall schematic. Illustrative only, not an official seat map.",
  },
  "pia-arena-mm": {
    venueId: "pia-arena-mm",
    accuracy: "schematic",
    shape: "arena-rectangle",
    stagePosition: "end",
    tiers: 2,
    hasArenaFloor: true,
    hasSecondFloor: true,
    notes: "Box arena schematic with end-stage concert layout.",
  },
  "yokohama-arena": {
    venueId: "yokohama-arena",
    accuracy: "schematic",
    shape: "arena-oval",
    stagePosition: "end",
    tiers: 2,
    hasArenaFloor: true,
    hasOuterRing: true,
    notes: "Rounded arena schematic with outer seating ring.",
  },
  "ariake-arena": {
    venueId: "ariake-arena",
    accuracy: "schematic",
    shape: "arena-rectangle",
    stagePosition: "end",
    tiers: 2,
    hasArenaFloor: true,
    hasSecondFloor: true,
    notes: "Rectangular arena schematic with end-stage concert layout.",
  },
  "belluna-dome": {
    venueId: "belluna-dome",
    accuracy: "schematic",
    shape: "dome",
    stagePosition: "end",
    tiers: 2,
    hasArenaFloor: true,
    hasOuterRing: true,
    notes: "Dome schematic with outer ring and end-stage floor.",
  },
  "tokyo-dome": {
    venueId: "tokyo-dome",
    accuracy: "schematic",
    shape: "dome",
    stagePosition: "end",
    tiers: 2,
    hasArenaFloor: true,
    hasOuterRing: true,
    notes: "Dome schematic with outer ring and end-stage floor.",
  },
  "makuhari-messe": {
    venueId: "makuhari-messe",
    accuracy: "schematic",
    shape: "exhibition-hall",
    stagePosition: "end",
    tiers: 1,
    hasArenaFloor: true,
    notes: "Exhibition hall schematic for flexible event layouts.",
  },
  "zepp-haneda": {
    venueId: "zepp-haneda",
    accuracy: "schematic",
    shape: "livehouse",
    stagePosition: "end",
    tiers: 1,
    hasArenaFloor: true,
    hasSecondFloor: true,
    notes: "Livehouse schematic with stage, standing floor, and balcony hint.",
  },
  "zepp-divercity-tokyo": {
    venueId: "zepp-divercity-tokyo",
    accuracy: "schematic",
    shape: "livehouse",
    stagePosition: "end",
    tiers: 1,
    hasArenaFloor: true,
    hasSecondFloor: true,
    notes: "Livehouse schematic with stage, standing floor, and balcony hint.",
  },
  "zepp-shinjuku-tokyo": {
    venueId: "zepp-shinjuku-tokyo",
    accuracy: "schematic",
    shape: "livehouse",
    stagePosition: "end",
    tiers: 1,
    hasArenaFloor: true,
    hasSecondFloor: true,
    notes: "Livehouse schematic with stage, standing floor, and balcony hint.",
  },
  "kt-zepp-yokohama": {
    venueId: "kt-zepp-yokohama",
    accuracy: "schematic",
    shape: "livehouse",
    stagePosition: "end",
    tiers: 1,
    hasArenaFloor: true,
    hasSecondFloor: true,
    notes: "Livehouse schematic with stage, standing floor, and balcony hint.",
  },
};
