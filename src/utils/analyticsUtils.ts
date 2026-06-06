import type { EventRecord, Venue } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import { countByValue, getTicketApplicationStats } from "./statisticsUtils";

export interface CountDatum {
  name: string;
  count: number;
}

export interface YearDatum {
  year: string;
  count: number;
}

export interface MonthDatum {
  month: string;
  count: number;
}

export interface CumulativeMonthDatum extends MonthDatum {
  cumulative: number;
}

export interface WeatherEventDatum {
  date: string;
  title: string;
  artist: string;
  venueName: string;
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
}

export interface WeatherSummary {
  averageTemperature: number | null;
  hottestEvent: EventRecord | null;
  coldestEvent: EventRecord | null;
  rainiestEvent: EventRecord | null;
  windiestEvent: EventRecord | null;
  weatherDataCount: number;
}

const countEntries = (items: EventRecord[], getValue: (event: EventRecord) => string | undefined) =>
  Object.entries(countByValue(items, getValue))
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));

const getValidDatePrefix = (date: string, length: number) => {
  const prefix = date.slice(0, length);
  return /^\d{4}(-\d{2})?$/.test(prefix) ? prefix : "Unknown";
};

const maxWeatherEvent = (
  events: EventRecord[],
  getValue: (event: EventRecord) => number | undefined,
) =>
  events
    .filter((event) => typeof getValue(event) === "number")
    .sort((first, second) => (getValue(second) ?? -Infinity) - (getValue(first) ?? -Infinity))[0] ?? null;

const minWeatherEvent = (
  events: EventRecord[],
  getValue: (event: EventRecord) => number | undefined,
) =>
  events
    .filter((event) => typeof getValue(event) === "number")
    .sort((first, second) => (getValue(first) ?? Infinity) - (getValue(second) ?? Infinity))[0] ?? null;

export const getEventsByYear = (events: EventRecord[]): YearDatum[] =>
  Object.entries(countByValue(events, (event) => getValidDatePrefix(event.date, 4)))
    .map(([year, count]) => ({ year, count }))
    .sort((first, second) => first.year.localeCompare(second.year));

export const getEventsByMonth = (events: EventRecord[]): MonthDatum[] =>
  Object.entries(countByValue(events, (event) => getValidDatePrefix(event.date, 7)))
    .map(([month, count]) => ({ month, count }))
    .sort((first, second) => first.month.localeCompare(second.month));

export const getCumulativeEventsByMonth = (events: EventRecord[]): CumulativeMonthDatum[] => {
  let cumulative = 0;

  return getEventsByMonth(events).map((item) => {
    cumulative += item.count;
    return { ...item, cumulative };
  });
};

export const getTopArtists = (events: EventRecord[], limit = 10): CountDatum[] =>
  countEntries(events, (event) => event.artist).slice(0, limit);

export const getTopVenues = (events: EventRecord[], limit = 10): CountDatum[] =>
  countEntries(events, (event) => event.venueName).slice(0, limit);

export const getEventsByRegion = (events: EventRecord[], venues: Venue[]): CountDatum[] => {
  const venueById = new Map(venues.map((venue) => [venue.id, venue]));

  return countEntries(events, (event) => {
    const venue = venueById.get(event.venueId);
    return venue?.region || venue?.prefecture || venue?.city || event.city || "Unknown";
  });
};

export const getWeatherSummary = (events: EventRecord[]): WeatherSummary => {
  const weatherEvents = events.filter((event) => event.weather);
  const temperatures = weatherEvents
    .map((event) => event.weather?.temperature)
    .filter((temperature): temperature is number => typeof temperature === "number");

  return {
    averageTemperature:
      temperatures.length > 0
        ? Math.round((temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length) * 10) / 10
        : null,
    hottestEvent: maxWeatherEvent(events, (event) => event.weather?.temperature),
    coldestEvent: minWeatherEvent(events, (event) => event.weather?.temperature),
    rainiestEvent: maxWeatherEvent(events, (event) => event.weather?.precipitation),
    windiestEvent: maxWeatherEvent(events, (event) => event.weather?.windSpeed),
    weatherDataCount: weatherEvents.length,
  };
};

export const getTemperatureTrend = (events: EventRecord[]): WeatherEventDatum[] =>
  events
    .filter((event) => typeof event.weather?.temperature === "number")
    .map((event) => ({
      date: event.date,
      title: event.title,
      artist: event.artist,
      venueName: event.venueName,
      temperature: event.weather?.temperature,
      precipitation: event.weather?.precipitation,
      windSpeed: event.weather?.windSpeed,
    }))
    .sort((first, second) => first.date.localeCompare(second.date));

export const getRainfallRanking = (events: EventRecord[], limit = 8): WeatherEventDatum[] =>
  events
    .filter((event) => typeof event.weather?.precipitation === "number")
    .map((event) => ({
      date: event.date,
      title: event.title,
      artist: event.artist,
      venueName: event.venueName,
      precipitation: event.weather?.precipitation,
    }))
    .sort((first, second) => (second.precipitation ?? 0) - (first.precipitation ?? 0))
    .slice(0, limit);

export const getTicketAnalytics = (ticketApplications: TicketApplication[]) =>
  getTicketApplicationStats(ticketApplications);
