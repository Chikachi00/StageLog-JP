import type { Venue } from "../types/event";

export const venues: Venue[] = [
  {
    id: "tokyo-dome",
    name: "Tokyo Dome",
    city: "Bunkyo",
    prefecture: "Tokyo",
    capacity: 55000,
    mapPath: "/venue-maps/tokyo-dome.svg",
    access: "Suidobashi Station / Korakuen Station",
  },
  {
    id: "belluna-dome",
    name: "Belluna Dome",
    city: "Tokorozawa",
    prefecture: "Saitama",
    capacity: 31552,
    mapPath: "/venue-maps/belluna-dome.svg",
    access: "Seibukyujo-mae Station",
  },
  {
    id: "k-arena-yokohama",
    name: "K Arena Yokohama",
    city: "Yokohama",
    prefecture: "Kanagawa",
    capacity: 20033,
    mapPath: "/venue-maps/k-arena-yokohama.svg",
    access: "Shin-Takashima Station / Yokohama Station",
  },
];

export const getVenueById = (venueId: string) =>
  venues.find((venue) => venue.id === venueId);
