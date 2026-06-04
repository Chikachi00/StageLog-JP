export type SeatMapLayoutType =
  | "end_stage"
  | "center_stage"
  | "arena"
  | "stadium"
  | "hall"
  | "livehouse";

export type SeatMapSection = {
  id: string;
  label: string;
  labelJa?: string;
  labelZh?: string;
  aliases?: string[];
  type: "arena" | "stand" | "stage" | "level" | "block" | "gate" | "other";
  level?: string;
  color?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  shape?: "rect" | "ellipse" | "polygon" | "arc";
  points?: string;
};

export type SeatMapDefinition = {
  venueId: string;
  name: string;
  layoutType: SeatMapLayoutType;
  viewBox: string;
  description?: string;
  sections: SeatMapSection[];
};

export type SeatMapMarker = {
  id: string;
  x: number;
  y: number;
  label?: string;
  color?: string;
  eventId?: string;
};
