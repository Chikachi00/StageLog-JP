import type { EventRecord, SeatInfo, Venue } from "../types/event";

const emptySeat: SeatInfo = {
  gate: "",
  level: "",
  block: "",
  row: "",
  number: "",
};

const createSampleEvent = (
  venue: Venue,
  event: Omit<EventRecord, "id" | "venueId" | "venueName" | "city" | "country" | "createdAt" | "updatedAt">,
): EventRecord => {
  const now = new Date().toISOString();

  return {
    ...event,
    id: crypto.randomUUID(),
    venueId: venue.id,
    venueName: venue.name,
    city: venue.city,
    country: venue.country,
    createdAt: now,
    updatedAt: now,
  };
};

export function createSampleEvents(venues: Venue[]): EventRecord[] {
  const tokyoDome = venues.find((venue) => venue.id === "tokyo-dome") ?? venues[0];
  const kArena = venues.find((venue) => venue.id === "k-arena-yokohama") ?? venues[0];
  const piaArena = venues.find((venue) => venue.id === "pia-arena-mm") ?? venues[0];

  return [
    createSampleEvent(tokyoDome, {
      title: "Aqours live at Tokyo Dome",
      artist: "Aqours",
      date: "2025-06-21",
      startTime: "17:00",
      ticketType: "Reserved seat",
      seat: {
        gate: "22",
        level: "1F",
        block: "A11",
        row: "14",
        number: "8",
        x: 48,
        y: 56,
      },
      notes: "Dome final with a bright blue ocean of penlights.",
    }),
    createSampleEvent(kArena, {
      title: "Idol live at K-Arena Yokohama",
      artist: "Starlight Project",
      date: "2025-09-13",
      startTime: "18:30",
      ticketType: "Fan club advance",
      seat: {
        gate: "North",
        level: "Level 5",
        block: "503",
        row: "7",
        number: "21",
        x: 62,
        y: 42,
      },
      notes: "Great sound from the upper level, especially for the encore.",
    }),
    createSampleEvent(piaArena, {
      title: "Anime concert at Pia Arena MM",
      artist: "Orchestra Colors",
      date: "2024-12-08",
      startTime: "16:00",
      ticketType: "General reserved",
      seat: {
        ...emptySeat,
        level: "2F",
        block: "B",
        row: "10",
        number: "15",
      },
      notes: "A compact arena show with strong strings and nostalgic visuals.",
    }),
  ];
}
