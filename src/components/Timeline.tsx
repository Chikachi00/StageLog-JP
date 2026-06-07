import { CalendarDays, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRecord } from "../types/event";
import { formatDate, formatEventTimeLabel, getEventYear, sortByDateDesc } from "../utils/dateUtils";
import { weatherCodeToKey } from "../utils/weatherUtils";

interface TimelineProps {
  events: EventRecord[];
  onEdit: (event: EventRecord) => void;
}

function TimelineItem({ event, onEdit }: { event: EventRecord; onEdit: (event: EventRecord) => void }) {
  const { t } = useTranslation();
  const eventTimeLabel = formatEventTimeLabel(event.doorsOpenTime, event.startTime, {
    doors: t("eventTime.doors"),
    start: t("eventTime.start"),
  });

  return (
    <article className="timeline-item">
      <time>{formatDate(event.date)}</time>
      <div>
        <strong>{event.title}</strong>
        <p>
          {event.artist} - {event.venueName}
        </p>
        {eventTimeLabel ? <span>{eventTimeLabel}</span> : null}
        {event.weather ? (
          <span>{t(weatherCodeToKey(event.weather.weatherCode))} / {event.weather.temperature.toFixed(1)} deg C</span>
        ) : (
          <span>{t("common.noWeatherData")}</span>
        )}
      </div>
      <button className="icon-button" type="button" onClick={() => onEdit(event)}>
        <Pencil size={16} aria-hidden="true" />
        {t("common.edit")}
      </button>
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
          <section className="timeline-year" key={year}>
            <h3>{year}</h3>
            <div>
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
