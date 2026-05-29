import type { Venue } from "../types/event";

interface VenueMapProps {
  venue: Venue;
}

export function VenueMap({ venue }: VenueMapProps) {
  return (
    <figure className="venue-map">
      <img src={venue.mapPath} alt={`${venue.name} seating map`} />
      <figcaption>
        <strong>{venue.name}</strong>
        <span>
          {venue.city}, {venue.prefecture}
        </span>
      </figcaption>
    </figure>
  );
}
