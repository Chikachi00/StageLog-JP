import type { EventFormValues, StageEvent } from "../types/event";

export const sampleEvents: StageEvent[] = [
  {
    id: "evt-001",
    title: "Dome Tour Final",
    artist: "Sample Artist",
    venueId: "tokyo-dome",
    date: "2026-03-14",
    seat: "Arena A7",
    ticketPrice: 12800,
    ticketStatus: "attended",
    notes: "Great view from the center block.",
    weather: "cloudy",
    temperatureC: 12,
  },
  {
    id: "evt-002",
    title: "Summer Live",
    artist: "North Stage",
    venueId: "belluna-dome",
    date: "2026-07-20",
    seat: "Stand 1-3",
    ticketPrice: 9800,
    ticketStatus: "won",
    weather: "sunny",
    temperatureC: 29,
  },
  {
    id: "evt-003",
    title: "Waterfront Session",
    artist: "K-Line",
    venueId: "k-arena-yokohama",
    date: "2026-10-05",
    ticketStatus: "entered",
    weather: "rainy",
    temperatureC: 18,
  },
];

export const createEventFromForm = (values: EventFormValues): StageEvent => ({
  id: crypto.randomUUID(),
  title: values.title.trim(),
  artist: values.artist.trim(),
  venueId: values.venueId,
  date: values.date,
  seat: values.seat.trim() || undefined,
  ticketPrice: values.ticketPrice ? Number(values.ticketPrice) : undefined,
  ticketStatus: values.ticketStatus,
  notes: values.notes.trim() || undefined,
});

export const getEventYears = (events: StageEvent[]) => {
  const years = events.map((event) => new Date(event.date).getFullYear());
  return Array.from(new Set(years)).sort((a, b) => b - a);
};

export const filterEventsByYear = (events: StageEvent[], year: number | "all") => {
  if (year === "all") {
    return events;
  }

  return events.filter((event) => new Date(event.date).getFullYear() === year);
};
