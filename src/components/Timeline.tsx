import { CalendarDays, Pencil } from "lucide-react";
import type { EventRecord } from "../types/event";
import { formatDate, getEventYear, sortByDateDesc } from "../utils/dateUtils";
import { weatherCodeToText } from "../utils/weatherUtils";

interface TimelineProps {
  events: EventRecord[];
  onEdit: (event: EventRecord) => void;
}

export function Timeline({ events, onEdit }: TimelineProps) {
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
        <h2>No timeline yet</h2>
        <p>Add events or load sample data to build your live history.</p>
      </section>
    );
  }

  return (
    <section className="timeline-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Chronological archive</span>
          <h2>Timeline</h2>
        </div>
      </div>

      <div className="timeline-list">
        {years.map((year) => (
          <section className="timeline-year" key={year}>
            <h3>{year}</h3>
            <div>
              {groupedEvents[year].map((event) => (
                <article className="timeline-item" key={event.id}>
                  <time>{formatDate(event.date)}</time>
                  <div>
                    <strong>{event.title}</strong>
                    <p>
                      {event.artist} - {event.venueName}
                    </p>
                    {event.weather ? (
                      <span>{weatherCodeToText(event.weather.weatherCode)} / {event.weather.temperature.toFixed(1)} deg C</span>
                    ) : (
                      <span>No weather data</span>
                    )}
                  </div>
                  <button className="icon-button" type="button" onClick={() => onEdit(event)}>
                    <Pencil size={16} aria-hidden="true" />
                    Edit
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
