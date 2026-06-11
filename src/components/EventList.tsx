import { LayoutGrid, Sparkles, Ticket } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { EventRecord } from "../types/event";
import type { CustomVenue } from "../types/venue";
import { getSeatMapByVenueId } from "../utils/seatMapUtils";
import { TicketCard } from "./TicketCard";
import { TicketWall } from "./TicketWall";

interface EventListProps {
  events: EventRecord[];
  customVenues?: CustomVenue[];
  isCompletelyEmpty: boolean;
  fetchingWeatherId: string | null;
  weatherErrors: Record<string, string>;
  onEdit: (event: EventRecord) => void;
  onDelete: (id: string) => void;
  onFetchWeather: (event: EventRecord) => void;
  onLoadSampleData: () => void;
  onViewVenueMap?: (venueId: string) => void;
}

export function EventList({
  events,
  customVenues = [],
  isCompletelyEmpty,
  fetchingWeatherId,
  weatherErrors,
  onEdit,
  onDelete,
  onFetchWeather,
  onLoadSampleData,
  onViewVenueMap,
}: EventListProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"cards" | "wall">("cards");

  if (events.length === 0) {
    return (
      <section className="empty-state">
        <Sparkles size={28} aria-hidden="true" />
        <h2>{isCompletelyEmpty ? t("empty.startArchive") : t("empty.noMatchingEvents")}</h2>
        <p>
          {isCompletelyEmpty
            ? t("empty.startArchiveDescription")
            : t("empty.noMatchingDescription")}
        </p>
        {isCompletelyEmpty ? (
          <button className="primary-button" type="button" onClick={onLoadSampleData}>
            <Sparkles size={17} aria-hidden="true" />
            {t("empty.loadSample")}
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <>
      <section className="event-view-toolbar" aria-label={t("events.viewMode")}>
        <div className="event-view-toggle" role="group">
          <button
            className={`event-view-toggle__button ${viewMode === "cards" ? "event-view-toggle__button--active" : ""}`}
            type="button"
            onClick={() => setViewMode("cards")}
          >
            <LayoutGrid size={16} aria-hidden="true" />
            {t("events.detailedCards")}
          </button>
          <button
            className={`event-view-toggle__button ${viewMode === "wall" ? "event-view-toggle__button--active" : ""}`}
            type="button"
            onClick={() => setViewMode("wall")}
          >
            <Ticket size={16} aria-hidden="true" />
            {t("events.ticketWall")}
          </button>
        </div>
      </section>

      {viewMode === "wall" ? (
        <TicketWall events={events} onEdit={onEdit} />
      ) : (
        <section className="ticket-grid" aria-label={t("events.savedRecords")}>
          {events.map((event) => (
            <TicketCard
              event={event}
              customVenues={customVenues}
              hasSeatMap={Boolean(getSeatMapByVenueId(event.venueId))}
              isFetchingWeather={fetchingWeatherId === event.id}
              key={event.id}
              weatherError={weatherErrors[event.id]}
              onDelete={onDelete}
              onEdit={onEdit}
              onFetchWeather={onFetchWeather}
              onViewVenueMap={onViewVenueMap}
            />
          ))}
        </section>
      )}
    </>
  );
}
