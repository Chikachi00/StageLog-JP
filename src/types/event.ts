export interface Venue {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface SeatInfo {
  gate: string;
  level: string;
  block: string;
  row: string;
  number: string;
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
  ticketType: string;
  seat: SeatInfo;
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
  ticketType: string;
  seat: SeatInfo;
  notes: string;
}

export interface EventFilters {
  year: string;
  artist: string;
  venue: string;
  search: string;
}
