import { useTranslation } from "react-i18next";
import type { EventRecord, Venue } from "../types/event";
import {
  getEventSeatMapMarker,
  getSeatMapByVenueId,
} from "../utils/seatMapUtils";
import { SeatMapRenderer } from "./SeatMapRenderer";
import { VenueThumbnail } from "./VenueThumbnail";

interface VenueMapProps {
  venue: Venue;
  events?: EventRecord[];
  event?: EventRecord;
  highlightedEventId?: string;
  compact?: boolean;
}

export function VenueMap({ venue, events = [], event, highlightedEventId, compact = false }: VenueMapProps) {
  const { t } = useTranslation();
  const seatMap = getSeatMapByVenueId(venue.id);
  const sourceEvents = event ? [event] : events;
  const markers = sourceEvents
    .map((markerEvent, index) => getEventSeatMapMarker(markerEvent, seatMap, index))
    .filter((marker): marker is NonNullable<typeof marker> => Boolean(marker))
    .map((marker, index) => ({
      ...marker,
      label: compact ? undefined : String(index + 1),
      color: marker.eventId === highlightedEventId ? "#e85d75" : undefined,
    }));

  if (!seatMap) {
    return (
      <div className="venue-map venue-map--empty">
        <VenueThumbnail venue={venue} />
        <p>{t("venues.detailedSeatMapNotAvailable")}</p>
      </div>
    );
  }

  return (
    <div className={compact ? "venue-map venue-map--compact" : "venue-map"}>
      <SeatMapRenderer markers={markers} seatMap={seatMap} />
      {!compact && markers.length === 0 ? (
        <p className="venue-map__empty">{t("seatMap.noMarkers")}</p>
      ) : null}
    </div>
  );
}
