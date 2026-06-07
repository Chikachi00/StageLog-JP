import { CalendarDays, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRecord } from "../types/event";
import { formatDate, getEventYear, normalizeTimeDisplay, sortByDateDesc } from "../utils/dateUtils";
import { weatherCodeToKey } from "../utils/weatherUtils";

interface TimelineProps {
  events: EventRecord[];
  onEdit: (event: EventRecord) => void;
}

function TimelineItem({ event, onEdit }: { event: EventRecord; onEdit: (event: EventRecord) => void }) {
  const { t } = useTranslation();
  const doorsOpenTime = normalizeTimeDisplay(event.doorsOpenTime);
  const startTime = normalizeTimeDisplay(event.startTime);
  const isUpcoming = event.date > new Date().toISOString().slice(0, 10);
  const weatherLabel = event.weather
    ? `${t(weatherCodeToKey(event.weather.weatherCode))} / ${event.weather.temperature.toFixed(1)}°C`
    : "";

  return (
    <article className="timeline-item">
      <time className="timeline-date" dateTime={event.date}>
        {formatDate(event.date)}
      </time>
      <div className="timeline-node" aria-hidden="true" />
      <div className="timeline-card">
        <div className="timeline-card__main">
          <div>
            <strong>{event.title}</strong>
            <p>
              {event.artist} · {event.venueName}
            </p>
          </div>
          <span className={`timeline-status ${isUpcoming ? "timeline-status--upcoming" : "timeline-status--completed"}`}>
            {isUpcoming ? t("timeline.upcoming") : t("timeline.completed")}
          </span>
        </div>

        <div className="timeline-meta" aria-label={t("timeline.title")}>
          {doorsOpenTime ? (
            <span className="timeline-badge">
              {t("eventTime.doors")} {doorsOpenTime}
            </span>
          ) : null}
          {startTime ? (
            <span className="timeline-badge">
              {t("eventTime.start")} {startTime}
            </span>
          ) : null}
          {weatherLabel ? <span className="timeline-badge timeline-badge--weather">{weatherLabel}</span> : null}
        </div>

        <button className="icon-button timeline-edit-button" type="button" onClick={() => onEdit(event)}>
          <Pencil size={16} aria-hidden="true" />
          {t("common.edit")}
        </button>
      </div>
    </article>
  );
}

export function Timeline({ events, onEdit }: TimelineProps) {
  const { t } = useTranslation();
  const groupedEvents = sortByDateDesc(events).reduce<Record<string, EventRecord[]>>((result, event) => {
    const year = getEventYear(event.date);
    result[year] = [...(result[year] ?? []), event];
    return result;
  }, {});
  const years = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  if (events.length === 0) {
    return (
      <section className="empty-state">
        <CalendarDays size={28} aria-hidden="true" />
        <h2>{t("timeline.emptyTitle")}</h2>
        <p>{t("timeline.emptyDescription")}</p>
      </section>
    );
  }

  return (
    <section className="timeline-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("timeline.eyebrow")}</span>
          <h2>{t("timeline.title")}</h2>
        </div>
      </div>

      <div className="timeline-list">
        {years.map((year) => (
          <section className="timeline-section" key={year}>
            <div className="timeline-year-header">
              <h3>{year}</h3>
            </div>
            <div className="timeline-year">
              {groupedEvents[year].map((event) => (
                <TimelineItem event={event} key={event.id} onEdit={onEdit} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
