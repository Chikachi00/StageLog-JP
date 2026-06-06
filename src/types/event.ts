export interface Venue {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  nameJa?: string;
  nameZh?: string;
  aliases?: string[];
  prefecture?: string;
  region?: string;
  category?: "dome" | "arena" | "hall" | "livehouse" | "convention" | "stadium" | "theater" | "other";
  capacity?: number;
  mapSvg?: string;
  mapType?: "svg" | "simple";
  supportedSeatMap?: boolean;
  thumbnailSvg?: string;
  thumbnailType?: "dome" | "arena" | "hall" | "livehouse" | "convention" | "stadium" | "theater" | "other";
}

export interface SeatInfo {
  gate?: string;
  level?: string;
  block?: string;
  row?: string;
  number?: string;
  sectionId?: string;
  sectionLabel?: string;
  x?: number;
  y?: number;
}

export interface WeatherInfo {
  temperature: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  fetchedAt: string;
}

export interface EventRecord {
  id: string;
  title: string;
  artist: string;
  date: string;
  startTime: string;
  venueId: string;
  venueName: string;
  city: string;
  country: string;
  prefecture?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isCustomVenue?: boolean;
  ticketType: string;
  seat: SeatInfo;
  imageUrl?: string;
  imagePath?: string;
  weather?: WeatherInfo;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventFormValues {
  title: string;
  artist: string;
  date: string;
  startTime: string;
  venueId: string;
  venueName: string;
  city: string;
  country: string;
  prefecture?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isCustomVenue?: boolean;
  ticketType: string;
  seat: SeatInfo;
  imageUrl?: string;
  imagePath?: string;
  imageFile?: File;
  removeImage?: boolean;
  notes: string;
}

export interface EventFilters {
  year: string;
  artist: string;
  venue: string;
  search: string;
}
