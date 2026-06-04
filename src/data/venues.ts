import type { Venue } from "../types/event";

export const venues: Venue[] = [
  {
    id: "tokyo-dome",
    name: "Tokyo Dome",
    city: "Tokyo",
    country: "Japan",
    latitude: 35.7056,
    longitude: 139.7519,
    mapSvg: "/venue-maps/tokyo-dome.svg",
    mapType: "svg",
    supportedSeatMap: true,
  },
  {
    id: "belluna-dome",
    name: "Belluna Dome",
    city: "Tokorozawa",
    country: "Japan",
    latitude: 35.7686,
    longitude: 139.4204,
    mapSvg: "/venue-maps/belluna-dome.svg",
    mapType: "svg",
    supportedSeatMap: true,
  },
  {
    id: "k-arena-yokohama",
    name: "K-Arena Yokohama",
    city: "Yokohama",
    country: "Japan",
    latitude: 35.4619,
    longitude: 139.6284,
    mapSvg: "/venue-maps/k-arena-yokohama.svg",
    mapType: "svg",
    supportedSeatMap: true,
  },
  {
    id: "pia-arena-mm",
    name: "Pia Arena MM",
    city: "Yokohama",
    country: "Japan",
    latitude: 35.4572,
    longitude: 139.6302,
  },
  {
    id: "yokohama-arena",
    name: "Yokohama Arena",
    city: "Yokohama",
    country: "Japan",
    latitude: 35.5123,
    longitude: 139.6201,
  },
  {
    id: "zepp-haneda",
    name: "Zepp Haneda",
    city: "Tokyo",
    country: "Japan",
    latitude: 35.5454,
    longitude: 139.7535,
  },
  {
    id: "numazu-civic-cultural-center",
    name: "Numazu Civic Cultural Center",
    city: "Numazu",
    country: "Japan",
    latitude: 35.1038,
    longitude: 138.8596,
  },
];

export const getVenueById = (venueId: string) =>
  venues.find((venue) => venue.id === venueId);
