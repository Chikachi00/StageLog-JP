import { ReceiptText, Thermometer, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRecord } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import { formatDate, getCurrentYear } from "../utils/dateUtils";
import { countByValue, getAverageTemperature, getTicketApplicationStats } from "../utils/statisticsUtils";
import { formatCurrencyAmount } from "../utils/ticketUtils";

interface StatisticsProps {
  events: EventRecord[];
  ticketApplications: TicketApplication[];
}

interface WeatherRankingItem {
  label: string;
  value: string;
  event: EventRecord;
}

const topEntry = (counts: Record<string, number>, noDataLabel: string) => {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0] ? `${entries[0][0]} (${entries[0][1]})` : noDataLabel;
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
  noDataLabel,
}: {
  title: string;
  items: Record<string, number>;
  noDataLabel: string;
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
        <p>{noDataLabel}</p>
      )}
    </article>
  );
};

export function Statistics({ events, ticketApplications }: StatisticsProps) {
  const { t } = useTranslation();
  const currentYear = getCurrentYear();
  const eventsThisYear = events.filter((event) => event.date.startsWith(currentYear)).length;
  const artistCounts = countByValue(events, (event) => event.artist);
  const venueCounts = countByValue(events, (event) => event.venueName);
  const yearCounts = countByValue(events, (event) => event.date.slice(0, 4));
  const ticketTypeCounts = countByValue(events, (event) => event.ticketType || "Live ticket");
  const averageTemperature = getAverageTemperature(events);
  const ticketStats = getTicketApplicationStats(ticketApplications);
  const weatherRankings = [
    maxBy(events, (event) => event.weather?.temperature, t("stats.hottest"), " deg C"),
    minBy(events, (event) => event.weather?.temperature, t("stats.coldest"), " deg C"),
    maxBy(events, (event) => event.weather?.precipitation, t("stats.rainiest"), "mm"),
    maxBy(events, (event) => event.weather?.windSpeed, t("stats.windiest"), "km/h"),
  ].filter((item): item is WeatherRankingItem => item !== null);

  return (
    <section className="statistics-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("stats.eyebrow")}</span>
          <h2>{t("stats.title")}</h2>
        </div>
      </div>

      <div className="stat-grid">
        <article>
          <span>{t("stats.totalEvents")}</span>
          <strong>{events.length}</strong>
        </article>
        <article>
          <span>{t("stats.eventsThisYear")}</span>
          <strong>{eventsThisYear}</strong>
        </article>
        <article>
          <span>{t("stats.uniqueArtists")}</span>
          <strong>{Object.keys(artistCounts).length}</strong>
        </article>
        <article>
          <span>{t("stats.uniqueVenues")}</span>
          <strong>{Object.keys(venueCounts).length}</strong>
        </article>
        <article>
          <span>{t("stats.mostWatchedArtist")}</span>
          <strong>{topEntry(artistCounts, t("common.noData"))}</strong>
        </article>
        <article>
          <span>{t("stats.mostVisitedVenue")}</span>
          <strong>{topEntry(venueCounts, t("common.noData"))}</strong>
        </article>
      </div>

      <section className="distribution-grid">
        <DistributionList title={t("stats.eventsByYear")} items={yearCounts} noDataLabel={t("common.noData")} />
        <DistributionList title={t("stats.eventsByArtist")} items={artistCounts} noDataLabel={t("common.noData")} />
        <DistributionList title={t("stats.eventsByVenue")} items={venueCounts} noDataLabel={t("common.noData")} />
        <DistributionList title={t("stats.ticketTypeDistribution")} items={ticketTypeCounts} noDataLabel={t("common.noData")} />
      </section>

      <section className="weather-ranking">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("stats.weatherEyebrow")}</span>
            <h2>{t("stats.weatherSummary")}</h2>
          </div>
          <Thermometer size={22} aria-hidden="true" />
        </div>

        <div className="weather-summary-cards">
          <article>
            <span>{t("stats.averageTemperature")}</span>
            <strong>{averageTemperature === null ? t("common.noData") : `${averageTemperature.toFixed(1)} deg C`}</strong>
          </article>
          <article>
            <span>{t("stats.weatherRecords")}</span>
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
            <p>{t("stats.noWeatherDataYet")}</p>
          </div>
        )}
      </section>

      <section className="ticket-statistics">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("stats.ticketEyebrow")}</span>
            <h2>{t("stats.ticketStatistics")}</h2>
          </div>
          <ReceiptText size={22} aria-hidden="true" />
        </div>
        <div className="stat-grid">
          <article>
            <span>{t("stats.totalApplications")}</span>
            <strong>{ticketStats.totalApplications}</strong>
          </article>
          <article>
            <span>{t("stats.wonCount")}</span>
            <strong>{ticketStats.wonCount}</strong>
          </article>
          <article>
            <span>{t("stats.lostCount")}</span>
            <strong>{ticketStats.lostCount}</strong>
          </article>
          <article>
            <span>{t("stats.winRate")}</span>
            <strong>{ticketStats.winRate === null ? "N/A" : `${ticketStats.winRate}%`}</strong>
          </article>
          <article>
            <span>{t("stats.totalPlannedSpending")}</span>
            <strong>{formatCurrencyAmount(ticketStats.totalPlannedSpending, ticketStats.displayCurrency)}</strong>
          </article>
          <article>
            <span>{t("stats.totalPaidAmount")}</span>
            <strong>{formatCurrencyAmount(ticketStats.totalPaidAmount, ticketStats.displayCurrency)}</strong>
          </article>
          <article>
            <span>{t("stats.averageTicketPrice")}</span>
            <strong>
              {ticketStats.averageTicketPrice === null
                ? "N/A"
                : formatCurrencyAmount(ticketStats.averageTicketPrice, ticketStats.displayCurrency)}
            </strong>
          </article>
        </div>
        <section className="distribution-grid">
          <DistributionList
            title={t("stats.applicationsByPlatform")}
            items={Object.fromEntries(
              Object.entries(ticketStats.byPlatform).map(([platform, count]) => [
                t(`platform.${platform}`, { defaultValue: platform }),
                count,
              ]),
            )}
            noDataLabel={t("common.noData")}
          />
          <DistributionList
            title={t("stats.applicationsByStatus")}
            items={Object.fromEntries(
              Object.entries(ticketStats.byStatus).map(([status, count]) => [
                t(`status.${status}`, { defaultValue: status }),
                count,
              ]),
            )}
            noDataLabel={t("common.noData")}
          />
        </section>
      </section>
    </section>
  );
}
