import { Edit3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRecord } from "../types/event";
import { formatDate, formatEventTimeLabel } from "../utils/dateUtils";

interface TicketWallCardProps {
  event: EventRecord;
  onEdit: (event: EventRecord) => void;
}

const getToday = () => new Date().toISOString().slice(0, 10);

export function TicketWallCard({ event, onEdit }: TicketWallCardProps) {
  const { t } = useTranslation();
  const isUpcoming = event.date > getToday();
  const location = [event.venueName, event.city, event.country].filter(Boolean).join(" / ");
  const recordCode = event.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "STAGE";
  const timeLabel = formatEventTimeLabel(event.doorsOpenTime, event.startTime, {
    doors: t("eventTime.doors"),
    start: t("eventTime.start"),
  });
  const temperature =
    typeof event.weather?.temperature === "number" ? `${event.weather.temperature.toFixed(1)}\u00b0C` : "";

  const handleEdit = () => onEdit(event);

  return (
    <article
      aria-label={event.title}
      className={`ticket-wall-card ${isUpcoming ? "ticket-wall-card--upcoming" : "ticket-wall-card--completed"}`}
      role="button"
      tabIndex={0}
      onClick={handleEdit}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          handleEdit();
        }
      }}
    >
      <div className="ticket-wall-card__main">
        <span className="ticket-wall-card__date">{formatDate(event.date)}</span>
        <h3 className="ticket-wall-card__title">{event.title}</h3>
        <p className="ticket-wall-card__artist">{event.artist}</p>
        <p className="ticket-wall-card__venue">{location || t("common.noData")}</p>
        <div className="ticket-wall-card__badges">
          {timeLabel ? <span>{timeLabel}</span> : null}
          {temperature ? <span>{temperature}</span> : null}
        </div>
      </div>

      <aside className="ticket-wall-card__stub">
        <span className="ticket-wall-card__status">
          {isUpcoming ? t("timeline.upcoming") : t("timeline.completed")}
        </span>
        <div className="ticket-wall-card__barcode" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <span className="ticket-wall-card__code">{recordCode}</span>
        <button
          aria-label={t("events.editTicketStub")}
          className="icon-button ticket-wall-card__edit"
          type="button"
          onClick={(mouseEvent) => {
            mouseEvent.stopPropagation();
            handleEdit();
          }}
        >
          <Edit3 size={16} aria-hidden="true" />
        </button>
      </aside>
    </article>
  );
}
