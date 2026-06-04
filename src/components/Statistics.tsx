import { ReceiptText, Thermometer, Trophy } from "lucide-react";
import type { EventRecord } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import { formatDate, getCurrentYear } from "../utils/dateUtils";
import { countByValue, getAverageTemperature, getTicketApplicationStats } from "../utils/statisticsUtils";
import { platformLabels, statusLabels } from "../utils/ticketUtils";

interface StatisticsProps {
  events: EventRecord[];
  ticketApplications: TicketApplication[];
}

interface WeatherRankingItem {
  label: string;
  value: string;
  event: EventRecord;
}

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

const DistributionList = ({
  title,
  items,
}: {
  title: string;
  items: Record<string, number>;
}) => {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);

  return (
    <article className="distribution-card">
      <h3>{title}</h3>
      {entries.length > 0 ? (
        <ul>
          {entries.map(([label, count]) => (
            <li key={label}>
              <span>{label}</span>
              <strong>{count}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>No data</p>
      )}
    </article>
  );
};

export function Statistics({ events, ticketApplications }: StatisticsProps) {
  const currentYear = getCurrentYear();
  const eventsThisYear = events.filter((event) => event.date.startsWith(currentYear)).length;
  const artistCounts = countByValue(events, (event) => event.artist);
  const venueCounts = countByValue(events, (event) => event.venueName);
  const yearCounts = countByValue(events, (event) => event.date.slice(0, 4));
  const ticketTypeCounts = countByValue(events, (event) => event.ticketType || "Live ticket");
  const averageTemperature = getAverageTemperature(events);
  const ticketStats = getTicketApplicationStats(ticketApplications);
  const weatherRankings = [
    maxBy(events, (event) => event.weather?.temperature, "Hottest live event", " deg C"),
    minBy(events, (event) => event.weather?.temperature, "Coldest live event", " deg C"),
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
          <strong>{Object.keys(artistCounts).length}</strong>
        </article>
        <article>
          <span>Unique venues</span>
          <strong>{Object.keys(venueCounts).length}</strong>
        </article>
        <article>
          <span>Most watched artist</span>
          <strong>{topEntry(artistCounts)}</strong>
        </article>
        <article>
          <span>Most visited venue</span>
          <strong>{topEntry(venueCounts)}</strong>
        </article>
      </div>

      <section className="distribution-grid">
        <DistributionList title="Events by year" items={yearCounts} />
        <DistributionList title="Events by artist" items={artistCounts} />
        <DistributionList title="Events by venue" items={venueCounts} />
        <DistributionList title="Ticket type distribution" items={ticketTypeCounts} />
      </section>

      <section className="weather-ranking">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Open-Meteo archive</span>
            <h2>Weather summary</h2>
          </div>
          <Thermometer size={22} aria-hidden="true" />
        </div>

        <div className="weather-summary-cards">
          <article>
            <span>Average temperature</span>
            <strong>{averageTemperature === null ? "No data" : `${averageTemperature.toFixed(1)} deg C`}</strong>
          </article>
          <article>
            <span>Weather records</span>
            <strong>{events.filter((event) => event.weather).length}</strong>
          </article>
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
                    {item.event.artist} - {formatDate(item.event.date)} - {item.event.venueName}
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

      <section className="ticket-statistics">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Lottery management</span>
            <h2>Ticket statistics</h2>
          </div>
          <ReceiptText size={22} aria-hidden="true" />
        </div>
        <div className="stat-grid">
          <article>
            <span>Total applications</span>
            <strong>{ticketStats.totalApplications}</strong>
          </article>
          <article>
            <span>Won count</span>
            <strong>{ticketStats.wonCount}</strong>
          </article>
          <article>
            <span>Lost count</span>
            <strong>{ticketStats.lostCount}</strong>
          </article>
          <article>
            <span>Win rate</span>
            <strong>{ticketStats.winRate === null ? "N/A" : `${ticketStats.winRate}%`}</strong>
          </article>
          <article>
            <span>Total planned spending</span>
            <strong>{ticketStats.totalPlannedSpending.toLocaleString()} JPY</strong>
          </article>
          <article>
            <span>Total paid amount</span>
            <strong>{ticketStats.totalPaidAmount.toLocaleString()} JPY</strong>
          </article>
          <article>
            <span>Average ticket price</span>
            <strong>
              {ticketStats.averageTicketPrice === null
                ? "N/A"
                : `${ticketStats.averageTicketPrice.toLocaleString()} JPY`}
            </strong>
          </article>
        </div>
        <section className="distribution-grid">
          <DistributionList
            title="Applications by platform"
            items={Object.fromEntries(
              Object.entries(ticketStats.byPlatform).map(([platform, count]) => [
                platformLabels[platform as keyof typeof platformLabels] ?? platform,
                count,
              ]),
            )}
          />
          <DistributionList
            title="Applications by status"
            items={Object.fromEntries(
              Object.entries(ticketStats.byStatus).map(([status, count]) => [
                statusLabels[status as keyof typeof statusLabels] ?? status,
                count,
              ]),
            )}
          />
        </section>
      </section>
    </section>
  );
}
