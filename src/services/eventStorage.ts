import type { EventRecord } from "../types/event";

export const STORAGE_KEY = "stagelog-events";

const isBrowser = () => typeof window !== "undefined" && Boolean(window.localStorage);

const normalizeEvent = (event: Partial<EventRecord>): EventRecord => {
  const now = new Date().toISOString();
  const seat = event.seat ?? {};

  return {
    id: event.id ?? crypto.randomUUID(),
    title: event.title ?? "",
    artist: event.artist ?? "",
    date: event.date ?? "",
    startTime: event.startTime ?? "",
    venueId: event.venueId ?? "",
    venueName: event.venueName ?? "",
    city: event.city ?? "",
    country: event.country ?? "",
    prefecture: event.prefecture,
    region: event.region,
    latitude: typeof event.latitude === "number" ? event.latitude : undefined,
    longitude: typeof event.longitude === "number" ? event.longitude : undefined,
    isCustomVenue: event.isCustomVenue,
    ticketType: event.ticketType ?? "",
    seat: {
      gate: seat.gate ?? "",
      level: seat.level ?? "",
      block: seat.block ?? "",
      row: seat.row ?? "",
      number: seat.number ?? "",
      sectionId: seat.sectionId,
      sectionLabel: seat.sectionLabel,
      x: typeof seat.x === "number" ? seat.x : undefined,
      y: typeof seat.y === "number" ? seat.y : undefined,
    },
    imageUrl: event.imageUrl,
    imagePath: event.imagePath,
    weather: event.weather,
    notes: event.notes ?? "",
    createdAt: event.createdAt ?? now,
    updatedAt: event.updatedAt ?? event.createdAt ?? now,
  };
};

export function getEvents(): EventRecord[] {
  if (!isBrowser()) {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((event) => normalizeEvent(event as Partial<EventRecord>)) : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: EventRecord[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function addEvent(event: EventRecord) {
  const events = [event, ...getEvents()];
  saveEvents(events);
  return event;
}

export function updateEvent(event: EventRecord) {
  const events = getEvents().map((item) => (item.id === event.id ? event : item));
  saveEvents(events);
  return event;
}

export function deleteEvent(id: string) {
  const events = getEvents().filter((event) => event.id !== id);
  saveEvents(events);
}
