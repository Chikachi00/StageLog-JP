import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRecord } from "../types/event";
import { getSeatMapByVenueId } from "../utils/seatMapUtils";
import { TicketCard } from "./TicketCard";

interface EventListProps {
  events: EventRecord[];
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
    <section className="ticket-grid" aria-label={t("events.savedRecords")}>
      {events.map((event) => (
        <TicketCard
          event={event}
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
  );
}
