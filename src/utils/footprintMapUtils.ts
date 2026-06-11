import type { EventRecord, Venue } from "../types/event";
import type { CustomVenue } from "../types/venue";
import { normalizeTimeDisplay } from "./dateUtils";
import { resolveVenueCoordinates } from "./venueSearchUtils";

export interface FootprintPoint {
  eventId: string;
  title: string;
  artist?: string;
  date: string;
  year: string;
  venueName?: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  doorsOpenTime?: string;
  startTime?: string;
  temperature?: number;
  weatherCode?: number;
  isUpcoming: boolean;
}

export interface MissingCoordinateEvent {
  eventId: string;
  title: string;
  date: string;
  year: string;
  venueName?: string;
  city?: string;
  country?: string;
  reason: "missing" | "invalid";
}

export interface FootprintUnlockItem {
  key: string;
  label: string;
  count: number;
}

interface FootprintFilter {
  year?: string;
  country?: string;
}

const ALL = "all";

const isAll = (value?: string) => !value || value === ALL;

const getToday = () => new Date().toISOString().slice(0, 10);

const hasCoordinateInput = (event: EventRecord) =>
  event.latitude !== undefined ||
  event.longitude !== undefined ||
  event.latitude === 0 ||
  event.longitude === 0;

const matchesFootprintFilter = (
  value: { year: string; country?: string },
  filters: FootprintFilter = {},
) => {
  const matchesYear = isAll(filters.year) || value.year === filters.year;
  const matchesCountry = isAll(filters.country) || (value.country || "Unknown") === filters.country;

  return matchesYear && matchesCountry;
};

export const resolveEventFootprintCoordinates = (
  event: EventRecord,
  venues: Venue[],
  customVenues: CustomVenue[] = [],
) =>
  resolveVenueCoordinates({
    venueId: event.venueId,
    venueName: event.venueName,
    city: event.city,
    country: event.country,
    latitude: event.latitude,
    longitude: event.longitude,
    venues,
    customVenues,
  });

export const buildFootprintPoints = (
  events: EventRecord[],
  venues: Venue[],
  customVenues: CustomVenue[] = [],
): FootprintPoint[] => {
  const today = getToday();
  const points: FootprintPoint[] = [];

  events.forEach((event) => {
    const coordinates = resolveEventFootprintCoordinates(event, venues, customVenues);

    if (!coordinates) {
      return;
    }

    points.push({
      eventId: event.id,
      title: event.title,
      artist: event.artist,
      date: event.date,
      year: event.date.slice(0, 4),
      venueName: event.venueName,
      city: event.city,
      country: event.country,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      doorsOpenTime: event.doorsOpenTime,
      startTime: event.startTime,
      temperature: event.weather?.temperature,
      weatherCode: event.weather?.weatherCode,
      isUpcoming: event.date > today,
    });
  });

  return points;
};

export const getFootprintYearOptions = (events: EventRecord[]) =>
  Array.from(new Set(events.map((event) => event.date.slice(0, 4)).filter(Boolean))).sort((a, b) =>
    b.localeCompare(a),
  );

export const getFootprintCountryOptions = (
  points: FootprintPoint[],
  missingEvents: MissingCoordinateEvent[] = [],
) =>
  Array.from(
    new Set(
      [...points.map((point) => point.country), ...missingEvents.map((event) => event.country)]
        .map((country) => country?.trim())
        .filter((country): country is string => Boolean(country)),
    ),
  ).sort((a, b) => a.localeCompare(b));

export const filterFootprintPoints = (points: FootprintPoint[], filters: FootprintFilter = {}) =>
  points.filter((point) => matchesFootprintFilter(point, filters));

const sortUnlockItems = (items: FootprintUnlockItem[]) =>
  items.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

export const getUnlockedCities = (points: FootprintPoint[]): FootprintUnlockItem[] => {
  const cityMap = new Map<string, FootprintUnlockItem>();

  points.forEach((point) => {
    const city = point.city?.trim();

    if (!city) {
      return;
    }

    const country = point.country?.trim();
    const key = [city.toLowerCase(), country?.toLowerCase()].filter(Boolean).join("|");
    const label = [city, country].filter(Boolean).join(" / ");
    const existing = cityMap.get(key);

    cityMap.set(key, {
      key,
      label,
      count: (existing?.count || 0) + 1,
    });
  });

  return sortUnlockItems(Array.from(cityMap.values()));
};

export const getUnlockedVenues = (points: FootprintPoint[]): FootprintUnlockItem[] => {
  const venueMap = new Map<string, FootprintUnlockItem>();

  points.forEach((point) => {
    const venueName = point.venueName?.trim();

    if (!venueName) {
      return;
    }

    const city = point.city?.trim();
    const key = [venueName.toLowerCase(), city?.toLowerCase()].filter(Boolean).join("|");
    const existing = venueMap.get(key);

    venueMap.set(key, {
      key,
      label: venueName,
      count: (existing?.count || 0) + 1,
    });
  });

  return sortUnlockItems(Array.from(venueMap.values()));
};

export const getMissingCoordinateEvents = (
  events: EventRecord[],
  venues: Venue[],
  customVenues: CustomVenue[] = [],
  filters: FootprintFilter = {},
): MissingCoordinateEvent[] =>
  events
    .filter((event) => !resolveEventFootprintCoordinates(event, venues, customVenues))
    .map((event): MissingCoordinateEvent => {
      const reason: MissingCoordinateEvent["reason"] = hasCoordinateInput(event) ? "invalid" : "missing";

      return {
        eventId: event.id,
        title: event.title,
        date: event.date,
        year: event.date.slice(0, 4),
        venueName: event.venueName,
        city: event.city,
        country: event.country,
        reason,
      };
    })
    .filter((event) => matchesFootprintFilter(event, filters));

export const formatFootprintPopupTime = (
  doorsOpenTime: string | undefined,
  startTime: string | undefined,
  labels: { doors: string; start: string },
) => {
  const doors = normalizeTimeDisplay(doorsOpenTime);
  const start = normalizeTimeDisplay(startTime);

  return {
    doors: doors ? `${labels.doors}: ${doors}` : "",
    start: start ? `${labels.start}: ${start}` : "",
  };
};
