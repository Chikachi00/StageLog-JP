import { MapPinned, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { venues } from "../data/venues";
import type { EventRecord } from "../types/event";
import { formatDate, sortByDateDesc } from "../utils/dateUtils";
import { VenueMap } from "./VenueMap";

interface VenuesPageProps {
  events: EventRecord[];
  selectedVenueId?: string;
  onEdit: (event: EventRecord) => void;
}

export function VenuesPage({ events, selectedVenueId, onEdit }: VenuesPageProps) {
  const { t } = useTranslation();
  const supportedVenues = venues.filter((venue) => venue.supportedSeatMap);
  const [activeVenueId, setActiveVenueId] = useState(selectedVenueId ?? supportedVenues[0]?.id ?? "");

  useEffect(() => {
    if (selectedVenueId) {
      setActiveVenueId(selectedVenueId);
    }
  }, [selectedVenueId]);

  const activeVenue = supportedVenues.find((venue) => venue.id === activeVenueId) ?? supportedVenues[0];
  const venueEvents = useMemo(
    () => sortByDateDesc(events.filter((event) => event.venueId === activeVenue?.id)),
    [activeVenue?.id, events],
  );
  const markedEvents = venueEvents.filter(
    (event) => typeof event.seat.x === "number" && typeof event.seat.y === "number",
  );

  if (!activeVenue) {
    return (
      <section className="empty-state">
        <MapPinned size={28} aria-hidden="true" />
        <h2>{t("venues.emptyTitle")}</h2>
        <p>{t("venues.emptyDescription")}</p>
      </section>
    );
  }

  return (
    <section className="venues-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("venues.eyebrow")}</span>
          <h2>{t("venues.title")}</h2>
        </div>
      </div>

      <div className="venue-tabs">
        {supportedVenues.map((venue) => {
          const count = events.filter((event) => event.venueId === venue.id).length;

          return (
            <button
              className={activeVenue.id === venue.id ? "is-active" : undefined}
              key={venue.id}
              type="button"
              onClick={() => setActiveVenueId(venue.id)}
            >
              {venue.name}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="venue-detail-grid">
        <section className="venue-map-panel">
          <div className="venue-map-panel__heading">
            <div>
              <h3>{activeVenue.name}</h3>
              <p>
                {t("venues.eventRecords", { count: venueEvents.length })} / {t("venues.seatMarkers", { count: markedEvents.length })}
              </p>
            </div>
          </div>
          <VenueMap venue={activeVenue} events={markedEvents} />
        </section>

        <section className="venue-history">
          <h3>{t("venues.history")}</h3>
          {venueEvents.length > 0 ? (
            <div className="venue-history-list">
              {venueEvents.map((event, index) => (
                <article key={event.id}>
                  <span className="marker-number">
                    {typeof event.seat.x === "number" && typeof event.seat.y === "number" ? index + 1 : "-"}
                  </span>
                  <div>
                    <strong>{event.title}</strong>
                    <p>
                      {event.artist} - {formatDate(event.date)}
                    </p>
                    <small>
                      {typeof event.seat.x === "number" && typeof event.seat.y === "number"
                        ? t("seat.marker", { x: event.seat.x.toFixed(1), y: event.seat.y.toFixed(1) })
                        : t("seat.noMarker")}
                    </small>
                  </div>
                  <button className="icon-button" type="button" onClick={() => onEdit(event)}>
                    <Pencil size={16} aria-hidden="true" />
                    {t("common.edit")}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state empty-state--compact">
              <p>{t("venues.noEvents")}</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
