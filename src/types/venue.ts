export type CustomVenueCategory =
  | "dome"
  | "arena"
  | "hall"
  | "livehouse"
  | "convention"
  | "stadium"
  | "theater"
  | "other";

export interface CustomVenue {
  id: string;
  userId?: string;
  name: string;
  nameJa?: string;
  nameZh?: string;
  aliases?: string[];
  city: string;
  country: string;
  prefecture?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  category?: CustomVenueCategory;
  capacity?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
