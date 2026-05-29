import { Thermometer, Trophy } from "lucide-react";
import type { EventRecord } from "../types/event";
import { formatDate, getCurrentYear } from "../utils/dateUtils";

interface StatisticsProps {
  events: EventRecord[];
}

interface WeatherRankingItem {
  label: string;
  value: string;
  event: EventRecord;
}

const countBy = (events: EventRecord[], key: "artist" | "venueName") =>
  events.reduce<Record<string, number>>((result, event) => {
    result[event[key]] = (result[event[key]] ?? 0) + 1;
    return result;
  }, {});

const topEntry = (counts: Record<string, number>) => {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0] ? `${entries[0][0]} (${entries[0][1]})` : "No data";
};

const maxBy = (
  events: EventRecord[],
  getValue: (event: EventRecord) => number | undefined,
  label: string,
  unit: string,
): WeatherRankingItem | null => {
  const candidates = events
    .map((event) => ({ event, value: getValue(event) }))
    .filter((item): item is { event: EventRecord; value: number } => typeof item.value === "number");

  const best = candidates.sort((a, b) => b.value - a.value)[0];
  return best ? { label, value: `${best.value.toFixed(1)}${unit}`, event: best.event } : null;
};

const minBy = (
  events: EventRecord[],
  getValue: (event: EventRecord) => number | undefined,
  label: string,
  unit: string,
): WeatherRankingItem | null => {
  const candidates = events
    .map((event) => ({ event, value: getValue(event) }))
    .filter((item): item is { event: EventRecord; value: number } => typeof item.value === "number");

  const best = candidates.sort((a, b) => a.value - b.value)[0];
  return best ? { label, value: `${best.value.toFixed(1)}${unit}`, event: best.event } : null;
};

export function Statistics({ events }: StatisticsProps) {
  const currentYear = getCurrentYear();
  const eventsThisYear = events.filter((event) => event.date.startsWith(currentYear)).length;
  const uniqueArtists = new Set(events.map((event) => event.artist)).size;
  const uniqueVenues = new Set(events.map((event) => event.venueName)).size;
  const weatherRankings = [
    maxBy(events, (event) => event.weather?.temperature, "Hottest live event", "°C"),
    minBy(events, (event) => event.weather?.temperature, "Coldest live event", "°C"),
    maxBy(events, (event) => event.weather?.precipitation, "Rainiest live event", "mm"),
    maxBy(events, (event) => event.weather?.windSpeed, "Windiest live event", "km/h"),
  ].filter((item): item is WeatherRankingItem => item !== null);

  return (
    <section className="statistics-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Personal archive</span>
          <h2>Statistics</h2>
        </div>
      </div>

      <div className="stat-grid">
        <article>
          <span>Total events</span>
          <strong>{events.length}</strong>
        </article>
        <article>
          <span>Events this year</span>
          <strong>{eventsThisYear}</strong>
        </article>
        <article>
          <span>Unique artists</span>
          <strong>{uniqueArtists}</strong>
        </article>
        <article>
          <span>Unique venues</span>
          <strong>{uniqueVenues}</strong>
        </article>
        <article>
          <span>Most watched artist</span>
          <strong>{topEntry(countBy(events, "artist"))}</strong>
        </article>
        <article>
          <span>Most visited venue</span>
          <strong>{topEntry(countBy(events, "venueName"))}</strong>
        </article>
      </div>

      <section className="weather-ranking">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Open-Meteo archive</span>
            <h2>Weather ranking</h2>
          </div>
          <Thermometer size={22} aria-hidden="true" />
        </div>

        {weatherRankings.length > 0 ? (
          <div className="ranking-list">
            {weatherRankings.map((item) => (
              <article key={item.label}>
                <Trophy size={18} aria-hidden="true" />
                <div>
                  <span>{item.label}</span>
                  <strong>{item.event.title}</strong>
                  <p>
                    {item.event.artist} · {formatDate(item.event.date)} · {item.event.venueName}
                  </p>
                </div>
                <b>{item.value}</b>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state empty-state--compact">
            <p>No weather data yet. Fetch weather from an event card first.</p>
          </div>
        )}
      </section>
    </section>
  );
}
