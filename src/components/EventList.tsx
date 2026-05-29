import { Sparkles } from "lucide-react";
import type { EventRecord } from "../types/event";
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
}: EventListProps) {
  if (events.length === 0) {
    return (
      <section className="empty-state">
        <Sparkles size={28} aria-hidden="true" />
        <h2>{isCompletelyEmpty ? "Start your live archive" : "No records match these filters"}</h2>
        <p>
          {isCompletelyEmpty
            ? "Add your first event or load sample data to explore the app."
            : "Try clearing filters or searching with a broader keyword."}
        </p>
        {isCompletelyEmpty ? (
          <button className="primary-button" type="button" onClick={onLoadSampleData}>
            <Sparkles size={17} aria-hidden="true" />
            Load sample data
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="ticket-grid" aria-label="Event records">
      {events.map((event) => (
        <TicketCard
          event={event}
          isFetchingWeather={fetchingWeatherId === event.id}
          key={event.id}
          weatherError={weatherErrors[event.id]}
          onDelete={onDelete}
          onEdit={onEdit}
          onFetchWeather={onFetchWeather}
        />
      ))}
    </section>
  );
}
