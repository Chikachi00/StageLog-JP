export type TicketStatus = "wishlist" | "entered" | "won" | "lost" | "attended";

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "snowy" | "windy";

export interface Venue {
  id: string;
  name: string;
  city: string;
  prefecture: string;
  capacity: number;
  mapPath: string;
  access: string;
}

export interface StageEvent {
  id: string;
  title: string;
  artist: string;
  venueId: string;
  date: string;
  seat?: string;
  ticketPrice?: number;
  ticketStatus: TicketStatus;
  notes?: string;
  weather?: WeatherCondition;
  temperatureC?: number;
}

export interface EventFormValues {
  title: string;
  artist: string;
  venueId: string;
  date: string;
  seat: string;
  ticketPrice: string;
  ticketStatus: TicketStatus;
  notes: string;
}
