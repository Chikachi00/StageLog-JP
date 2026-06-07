import type { EventRecord, Venue } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import type { CustomVenue } from "../types/venue";

const isPresentString = (value: string | undefined): value is string => Boolean(value);

export interface VenueValue {
  venueId?: string;
  venueName?: string;
  city?: string;
  country?: string;
  prefecture?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isCustomVenue?: boolean;
}

export type VenueCandidate = VenueValue & {
  id: string;
  label: string;
  detail: string;
  searchText: string;
  source: "built-in" | "custom" | "recent-custom";
  category?: Venue["category"];
  capacity?: number;
  aliases?: string[];
  names?: string[];
};

export const isCustomVenueId = (venueId?: string) => Boolean(venueId?.startsWith("custom:"));

export const normalizeVenueSearchText = (value: string) =>
  value
    .replace(/\u3000/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const slugifyVenuePart = (value: string) =>
  normalizeVenueSearchText(value)
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff\s-]+/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const buildCustomVenueId = (name: string, city?: string) => {
  const slug = [name, city].map((part) => slugifyVenuePart(part ?? "")).filter(Boolean).join("-");
  return `custom:${slug || Date.now()}`;
};

export const getVenueSearchText = (venue: Venue) =>
  normalizeVenueSearchText(
    [
      venue.name,
      venue.nameJa,
      venue.nameZh,
      ...(venue.aliases ?? []),
      venue.city,
      venue.prefecture,
      venue.region,
      venue.country,
      venue.category,
    ]
      .filter(Boolean)
      .join(" "),
  );

const getBuiltInCandidate = (venue: Venue): VenueCandidate => ({
  id: venue.id,
  venueId: venue.id,
  venueName: venue.name,
  city: venue.city,
  country: venue.country,
  prefecture: venue.prefecture,
  region: venue.region,
  latitude: venue.latitude,
  longitude: venue.longitude,
  label: venue.name,
  detail: [venue.nameJa, venue.nameZh, venue.city, venue.prefecture ?? venue.region, venue.category]
    .filter(Boolean)
    .join(" / "),
  searchText: getVenueSearchText(venue),
  source: "built-in",
  category: venue.category,
  capacity: venue.capacity,
  aliases: venue.aliases,
  names: [venue.name, venue.nameJa, venue.nameZh].filter(isPresentString),
});

export const searchVenues = (venues: Venue[], query: string, limit = 20): VenueCandidate[] => {
  const normalizedQuery = normalizeVenueSearchText(query);
  const candidates = venues.map(getBuiltInCandidate);

  if (!normalizedQuery) {
    return candidates.slice(0, limit);
  }

  return candidates
    .map((candidate) => {
      const names = (candidate.names ?? [candidate.venueName, candidate.label]).map((value) =>
        normalizeVenueSearchText(value ?? ""),
      );
      const aliases = candidate.aliases?.map(normalizeVenueSearchText) ?? [];
      const location = [candidate.city, candidate.prefecture, candidate.region].map((value) =>
        normalizeVenueSearchText(value ?? ""),
      );
      const category = normalizeVenueSearchText(candidate.category ?? "");
      let score = 0;

      if (names.some((name) => name === normalizedQuery)) score += 100;
      if (names.some((name) => name.startsWith(normalizedQuery))) score += 80;
      if (aliases.some((alias) => alias.includes(normalizedQuery))) score += 55;
      if (location.some((item) => item.includes(normalizedQuery))) score += 35;
      if (category.includes(normalizedQuery)) score += 20;
      if (candidate.searchText.includes(normalizedQuery)) score += 10;

      return { candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score || first.candidate.label.localeCompare(second.candidate.label))
    .slice(0, limit)
    .map((item) => item.candidate);
};

const getCustomVenueKey = (venue: VenueValue) =>
  [venue.venueName, venue.city, venue.country].map((value) => normalizeVenueSearchText(value ?? "")).join("::");

type CoordinateInput = number | string | null | undefined;

interface VenueCoordinateSource extends VenueValue {
  name?: string;
}

interface ResolveVenueCoordinatesInput extends VenueValue {
  venues: Venue[];
  customVenues?: CustomVenue[];
  historicalVenues?: VenueValue[];
}

export interface ResolvedVenueCoordinates {
  latitude: number;
  longitude: number;
  source: "event" | "built-in" | "custom" | "recent-custom";
}

const parseCoordinate = (value: CoordinateInput, min: number, max: number) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= min && value <= max ? value : undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (!/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    return undefined;
  }

  const parsed = Number.parseFloat(trimmed);

  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : undefined;
};

const readCoordinatePair = (latitude: CoordinateInput, longitude: CoordinateInput) => {
  const parsedLatitude = parseCoordinate(latitude, -90, 90);
  const parsedLongitude = parseCoordinate(longitude, -180, 180);

  if (parsedLatitude === undefined || parsedLongitude === undefined) {
    return null;
  }

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
  };
};

const getVenueNameForMatch = (venue: VenueCoordinateSource) => venue.venueName ?? venue.name ?? "";

const isSameVenueSnapshot = (source: VenueCoordinateSource, target: VenueCoordinateSource) => {
  const sourceName = normalizeVenueSearchText(getVenueNameForMatch(source));
  const targetName = normalizeVenueSearchText(getVenueNameForMatch(target));
  const sourceCity = normalizeVenueSearchText(source.city ?? "");
  const targetCity = normalizeVenueSearchText(target.city ?? "");
  const sourceCountry = normalizeVenueSearchText(source.country ?? "");
  const targetCountry = normalizeVenueSearchText(target.country ?? "");

  if (!sourceName || !targetName || sourceName !== targetName) {
    return false;
  }

  if (sourceCity && targetCity && sourceCity !== targetCity) {
    return false;
  }

  if (sourceCountry && targetCountry && sourceCountry !== targetCountry) {
    return false;
  }

  return true;
};

export const resolveVenueCoordinates = ({
  venues,
  customVenues = [],
  historicalVenues = [],
  ...target
}: ResolveVenueCoordinatesInput): ResolvedVenueCoordinates | null => {
  const eventCoordinates = readCoordinatePair(target.latitude, target.longitude);

  if (eventCoordinates) {
    return { ...eventCoordinates, source: "event" };
  }

  const builtInVenue = target.venueId ? venues.find((venue) => venue.id === target.venueId) : undefined;
  const builtInCoordinates = builtInVenue
    ? readCoordinatePair(builtInVenue.latitude, builtInVenue.longitude)
    : null;

  if (builtInCoordinates) {
    return { ...builtInCoordinates, source: "built-in" };
  }

  const customVenueById = target.venueId
    ? customVenues.find((venue) => venue.id === target.venueId)
    : undefined;
  const customVenueByIdCoordinates = customVenueById
    ? readCoordinatePair(customVenueById.latitude, customVenueById.longitude)
    : null;

  if (customVenueByIdCoordinates) {
    return { ...customVenueByIdCoordinates, source: "custom" };
  }

  const customVenueBySnapshot = customVenues.find((venue) => isSameVenueSnapshot(venue, target));
  const customVenueBySnapshotCoordinates = customVenueBySnapshot
    ? readCoordinatePair(customVenueBySnapshot.latitude, customVenueBySnapshot.longitude)
    : null;

  if (customVenueBySnapshotCoordinates) {
    return { ...customVenueBySnapshotCoordinates, source: "custom" };
  }

  const historicalVenue =
    (target.venueId ? historicalVenues.find((venue) => venue.venueId === target.venueId) : undefined) ??
    historicalVenues.find((venue) => isSameVenueSnapshot(venue, target));
  const historicalCoordinates = historicalVenue
    ? readCoordinatePair(historicalVenue.latitude, historicalVenue.longitude)
    : null;

  if (historicalCoordinates) {
    return { ...historicalCoordinates, source: "recent-custom" };
  }

  return null;
};

export const extractHistoricalCustomVenues = (
  events: EventRecord[] = [],
  ticketApplications: TicketApplication[] = [],
  builtInVenues: Venue[] = [],
): VenueCandidate[] => {
  const builtInIds = new Set(builtInVenues.map((venue) => venue.id));
  const seen = new Set<string>();
  const candidates: VenueCandidate[] = [];
  const addCandidate = (value: VenueValue) => {
    const venueName = value.venueName?.trim();

    if (!venueName) {
      return;
    }

    const isCustom =
      value.isCustomVenue ||
      isCustomVenueId(value.venueId) ||
      !value.venueId ||
      !builtInIds.has(value.venueId);

    if (!isCustom) {
      return;
    }

    const key = getCustomVenueKey(value);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    candidates.push({
      id: value.venueId || buildCustomVenueId(venueName, value.city),
      venueId: value.venueId || buildCustomVenueId(venueName, value.city),
      venueName,
      city: value.city || "Unknown",
      country: value.country || "Japan",
      prefecture: value.prefecture,
      region: value.region,
      latitude: value.latitude,
      longitude: value.longitude,
      isCustomVenue: true,
      label: venueName,
      detail: [value.city, value.prefecture ?? value.region, value.country].filter(Boolean).join(" / "),
      searchText: normalizeVenueSearchText(
        [venueName, value.city, value.prefecture, value.region, value.country].filter(Boolean).join(" "),
      ),
      source: "recent-custom",
    });
  };

  events.forEach((event) => addCandidate(event));
  ticketApplications.forEach((application) => addCandidate(application));

  return candidates.sort((first, second) => first.label.localeCompare(second.label));
};

export const getHistoricalCustomVenues = extractHistoricalCustomVenues;
