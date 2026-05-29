import type { EventRecord } from "../types/event";

export const STORAGE_KEY = "stagelog-events";

const isBrowser = () => typeof window !== "undefined" && Boolean(window.localStorage);

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
    return Array.isArray(parsed) ? (parsed as EventRecord[]) : [];
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
