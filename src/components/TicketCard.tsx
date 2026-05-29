import { CloudSun, Pencil, Trash2 } from "lucide-react";
import type { EventRecord } from "../types/event";
import { formatDateTime } from "../utils/dateUtils";
import { formatWeatherSummary } from "../utils/weatherUtils";

interface TicketCardProps {
  event: EventRecord;
  isFetchingWeather: boolean;
  weatherError?: string;
  onEdit: (event: EventRecord) => void;
  onDelete: (id: string) => void;
  onFetchWeather: (event: EventRecord) => void;
}

const compactSeat = (event: EventRecord) => {
  const parts = [
    event.seat.gate ? `Gate ${event.seat.gate}` : "",
    event.seat.level,
    event.seat.block ? `Block ${event.seat.block}` : "",
    event.seat.row ? `Row ${event.seat.row}` : "",
    event.seat.number ? `Seat ${event.seat.number}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Seat not recorded";
};

export function TicketCard({
  event,
  isFetchingWeather,
  weatherError,
  onEdit,
  onDelete,
  onFetchWeather,
}: TicketCardProps) {
  const notesPreview =
    event.notes.length > 110 ? `${event.notes.slice(0, 110).trim()}...` : event.notes;

  return (
    <article className="ticket-card">
      <div className="ticket-card__accent" aria-hidden="true" />
      <div className="ticket-card__main">
        <div className="ticket-card__topline">
          <span>{event.ticketType || "Live ticket"}</span>
          <span>{formatDateTime(event.date, event.startTime)}</span>
        </div>
        <h3>{event.title}</h3>
        <p className="ticket-card__artist">{event.artist}</p>

        <div className="ticket-card__details">
          <div>
            <span>Venue</span>
            <strong>{event.venueName}</strong>
            <small>
              {event.city}, {event.country}
            </small>
          </div>
          <div>
            <span>Seat</span>
            <strong>{compactSeat(event)}</strong>
          </div>
        </div>

        {event.weather ? (
          <p className="weather-pill">{formatWeatherSummary(event.weather)}</p>
        ) : (
          <p className="weather-pill weather-pill--empty">No weather data yet</p>
        )}

        {notesPreview ? <p className="ticket-card__notes">{notesPreview}</p> : null}
        {weatherError ? <p className="ticket-card__error">{weatherError}</p> : null}
      </div>

      <div className="ticket-card__stub">
        <div className="ticket-card__barcode" aria-hidden="true" />
        <div className="ticket-card__actions">
          <button className="icon-button" type="button" onClick={() => onEdit(event)}>
            <Pencil size={16} aria-hidden="true" />
            Edit
          </button>
          <button className="icon-button" type="button" onClick={() => onDelete(event.id)}>
            <Trash2 size={16} aria-hidden="true" />
            Delete
          </button>
          <button
            className="icon-button icon-button--weather"
            type="button"
            disabled={isFetchingWeather}
            onClick={() => onFetchWeather(event)}
          >
            <CloudSun size={16} aria-hidden="true" />
            {isFetchingWeather ? "Fetching..." : "Fetch Weather"}
          </button>
        </div>
      </div>
    </article>
  );
}
