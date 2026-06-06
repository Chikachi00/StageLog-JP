import type { EventRecord, Venue } from "../types/event";
import type { TicketApplication } from "../types/ticket";

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
  source: "built-in" | "custom";
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
      source: "custom",
    });
  };

  events.forEach((event) => addCandidate(event));
  ticketApplications.forEach((application) => addCandidate(application));

  return candidates.sort((first, second) => first.label.localeCompare(second.label));
};

export const getHistoricalCustomVenues = extractHistoricalCustomVenues;
