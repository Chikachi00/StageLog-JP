import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRecord, Venue } from "../types/event";
import { formatDate } from "../utils/dateUtils";

interface VenueMapProps {
  venue: Venue;
  events?: EventRecord[];
  event?: EventRecord;
  highlightedEventId?: string;
  compact?: boolean;
}

const getEventsWithMarkers = (events: EventRecord[]) =>
  events.filter((event) => typeof event.seat?.x === "number" && typeof event.seat?.y === "number");

export function VenueMap({ venue, events = [], event, highlightedEventId, compact = false }: VenueMapProps) {
  const { t } = useTranslation();
  const markerEvents = getEventsWithMarkers(event ? [event] : events);

  if (!venue.supportedSeatMap || !venue.mapSvg) {
    return (
      <div className="venue-map venue-map--empty">
        <p>{t("seat.unsupported")}</p>
      </div>
    );
  }

  return (
    <div className={compact ? "venue-map venue-map--compact" : "venue-map"}>
      <img src={venue.mapSvg} alt={`${venue.name} simplified venue map`} />
      {markerEvents.map((markerEvent, index) => (
        <span
          className="venue-map__marker"
          data-highlighted={highlightedEventId === markerEvent.id ? "true" : undefined}
          key={markerEvent.id}
          style={{ left: `${markerEvent.seat?.x}%`, top: `${markerEvent.seat?.y}%` }}
          title={`${index + 1}. ${markerEvent.title} - ${formatDate(markerEvent.date)}`}
        >
          {compact ? <MapPin size={14} aria-hidden="true" /> : index + 1}
        </span>
      ))}
      {!compact && markerEvents.length === 0 ? (
        <p className="venue-map__empty">{t("seat.noMarkers")}</p>
      ) : null}
    </div>
  );
}
