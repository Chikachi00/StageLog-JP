import { BarChart3, CloudRain, ReceiptText, Thermometer, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EventRecord, Venue } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import {
  getCumulativeEventsByMonth,
  getEventsByRegion,
  getEventsByYear,
  getRainfallRanking,
  getTemperatureTrend,
  getTicketAnalytics,
  getTopArtists,
  getTopVenues,
  getWeatherSummary,
} from "../utils/analyticsUtils";
import { formatDate } from "../utils/dateUtils";

interface AnalyticsProps {
  events: EventRecord[];
  ticketApplications: TicketApplication[];
  venues: Venue[];
}

interface ChartCardProps {
  title: string;
  description?: string;
  isEmpty?: boolean;
  emptyLabel: string;
  children: ReactNode;
}

const chartColors = ["#e84f7a", "#13a7a0", "#7f56d9", "#f4b942", "#0e7490", "#b08968", "#4f5d75", "#ef8354"];

const formatCurrency = (value: number) => `${Math.round(value).toLocaleString()} JPY`;

const truncate = (value: string, maxLength = 18) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;

function ChartCard({ title, description, isEmpty, emptyLabel, children }: ChartCardProps) {
  return (
    <article className="analytics-card">
      <div className="analytics-card__heading">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {isEmpty ? (
        <div className="empty-state empty-state--compact">
          <p>{emptyLabel}</p>
        </div>
      ) : (
        <div className="analytics-chart">{children}</div>
      )}
    </article>
  );
}

const eventLabel = (event: EventRecord | null, fallback: string, unit?: string, value?: number) => {
  if (!event) {
    return fallback;
  }

  const suffix = typeof value === "number" && unit ? ` - ${value.toFixed(1)}${unit}` : "";
  return `${event.title} · ${formatDate(event.date)}${suffix}`;
};

export function Analytics({ events, ticketApplications, venues }: AnalyticsProps) {
  const { t } = useTranslation();
  const eventsByYear = useMemo(() => getEventsByYear(events), [events]);
  const cumulativeByMonth = useMemo(() => getCumulativeEventsByMonth(events), [events]);
  const topArtists = useMemo(() => getTopArtists(events), [events]);
  const topVenues = useMemo(() => getTopVenues(events), [events]);
  const regionData = useMemo(() => getEventsByRegion(events, venues), [events, venues]);
  const weatherSummary = useMemo(() => getWeatherSummary(events), [events]);
  const temperatureTrend = useMemo(() => getTemperatureTrend(events), [events]);
  const rainfallRanking = useMemo(() => getRainfallRanking(events), [events]);
  const ticketStats = useMemo(() => getTicketAnalytics(ticketApplications), [ticketApplications]);
  const statusData = useMemo(
    () =>
      Object.entries(ticketStats.byStatus).map(([status, count]) => ({
        name: t(`status.${status}`, { defaultValue: status }),
        count,
      })),
    [t, ticketStats.byStatus],
  );
  const platformData = useMemo(
    () =>
      Object.entries(ticketStats.byPlatform).map(([platform, count]) => ({
        name: t(`platform.${platform}`, { defaultValue: platform }),
        count,
      })),
    [t, ticketStats.byPlatform],
  );

  return (
    <section className="analytics-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("analytics.eyebrow")}</span>
          <h2>{t("analytics.title")}</h2>
        </div>
        <BarChart3 size={22} aria-hidden="true" />
      </div>

      <section className="analytics-overview-grid" aria-label={t("analytics.overview")}>
        <article>
          <TrendingUp size={18} aria-hidden="true" />
          <span>{t("stats.totalEvents")}</span>
          <strong>{events.length}</strong>
        </article>
        <article>
          <BarChart3 size={18} aria-hidden="true" />
          <span>{t("analytics.topArtists")}</span>
          <strong>{topArtists[0] ? `${topArtists[0].name} (${topArtists[0].count})` : t("common.noData")}</strong>
        </article>
        <article>
          <Thermometer size={18} aria-hidden="true" />
          <span>{t("analytics.averageTemperature")}</span>
          <strong>
            {weatherSummary.averageTemperature === null
              ? t("common.noData")
              : `${weatherSummary.averageTemperature.toFixed(1)}°C`}
          </strong>
        </article>
        <article>
          <ReceiptText size={18} aria-hidden="true" />
          <span>{t("analytics.winRate")}</span>
          <strong>{ticketStats.winRate === null ? "N/A" : `${ticketStats.winRate}%`}</strong>
        </article>
      </section>

      <section className="analytics-grid">
        <ChartCard
          title={t("analytics.attendanceByYear")}
          description={t("analytics.attendanceTrend")}
          emptyLabel={t("analytics.noEventData")}
          isEmpty={eventsByYear.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventsByYear}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" />
              <YAxis allowDecimals={false} width={32} />
              <Tooltip />
              <Bar dataKey="count" name={t("analytics.monthlyAttendance")} fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t("analytics.monthlyAttendance")}
          description={t("analytics.cumulativeAttendance")}
          emptyLabel={t("analytics.noEventData")}
          isEmpty={cumulativeByMonth.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeByMonth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" minTickGap={16} />
              <YAxis allowDecimals={false} width={32} />
              <Tooltip />
              <Legend />
              <Area
                dataKey="cumulative"
                name={t("analytics.cumulativeAttendance")}
                fill="var(--accent)"
                fillOpacity={0.16}
                stroke="var(--accent)"
                strokeWidth={2}
              />
              <Line dataKey="count" name={t("analytics.monthlyAttendance")} stroke="var(--accent-2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t("analytics.topArtists")}
          emptyLabel={t("analytics.noEventData")}
          isEmpty={topArtists.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topArtists.map((item) => ({ ...item, shortName: truncate(item.name) }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis allowDecimals={false} type="number" />
              <YAxis dataKey="shortName" type="category" width={105} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value, _name, item) => [value, item.payload.name]} />
              <Bar dataKey="count" name={t("analytics.topArtists")} fill="var(--accent)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("analytics.topVenues")} emptyLabel={t("analytics.noEventData")} isEmpty={topVenues.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topVenues.map((item) => ({ ...item, shortName: truncate(item.name) }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis allowDecimals={false} type="number" />
              <YAxis dataKey="shortName" type="category" width={105} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value, _name, item) => [value, item.payload.name]} />
              <Bar dataKey="count" name={t("analytics.topVenues")} fill="var(--accent-2)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t("analytics.regionDistribution")}
          emptyLabel={t("analytics.noEventData")}
          isEmpty={regionData.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={regionData} dataKey="count" nameKey="name" innerRadius="45%" outerRadius="72%" paddingAngle={2}>
                {regionData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={t("analytics.temperatureTrend")}
          description={t("analytics.weatherAnalytics")}
          emptyLabel={`${t("analytics.noWeatherData")} ${t("analytics.fetchWeatherFirst")}`}
          isEmpty={temperatureTrend.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={temperatureTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" minTickGap={18} />
              <YAxis width={38} unit="°C" />
              <Tooltip formatter={(value) => [`${value}°C`, t("analytics.averageTemperature")]} />
              <Line
                dataKey="temperature"
                name={t("analytics.averageTemperature")}
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="analytics-insight-grid">
        <article className="analytics-card">
          <div className="analytics-card__heading">
            <h3>{t("analytics.weatherAnalytics")}</h3>
            <p>{t("analytics.fetchWeatherFirst")}</p>
          </div>
          {weatherSummary.weatherDataCount > 0 ? (
            <div className="analytics-metric-list">
              <p>
                <CloudRain size={16} aria-hidden="true" />
                <span>{t("analytics.hottestEvent")}</span>
                <strong>
                  {eventLabel(
                    weatherSummary.hottestEvent,
                    t("common.noData"),
                    "°C",
                    weatherSummary.hottestEvent?.weather?.temperature,
                  )}
                </strong>
              </p>
              <p>
                <CloudRain size={16} aria-hidden="true" />
                <span>{t("analytics.coldestEvent")}</span>
                <strong>
                  {eventLabel(
                    weatherSummary.coldestEvent,
                    t("common.noData"),
                    "°C",
                    weatherSummary.coldestEvent?.weather?.temperature,
                  )}
                </strong>
              </p>
              <p>
                <CloudRain size={16} aria-hidden="true" />
                <span>{t("analytics.rainiestEvent")}</span>
                <strong>
                  {eventLabel(
                    weatherSummary.rainiestEvent,
                    t("common.noData"),
                    "mm",
                    weatherSummary.rainiestEvent?.weather?.precipitation,
                  )}
                </strong>
              </p>
              <p>
                <CloudRain size={16} aria-hidden="true" />
                <span>{t("analytics.windiestEvent")}</span>
                <strong>
                  {eventLabel(
                    weatherSummary.windiestEvent,
                    t("common.noData"),
                    "km/h",
                    weatherSummary.windiestEvent?.weather?.windSpeed,
                  )}
                </strong>
              </p>
            </div>
          ) : (
            <div className="empty-state empty-state--compact">
              <p>{t("analytics.noWeatherData")}</p>
            </div>
          )}
        </article>

        <ChartCard
          title={t("analytics.rainiestEvent")}
          emptyLabel={t("analytics.noWeatherData")}
          isEmpty={rainfallRanking.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rainfallRanking.map((item) => ({ ...item, shortName: truncate(item.title, 20) }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="shortName" tick={{ fontSize: 11 }} />
              <YAxis width={38} unit="mm" />
              <Tooltip formatter={(value, _name, item) => [`${value}mm`, item.payload.title]} />
              <Bar dataKey="precipitation" name={t("analytics.rainiestEvent")} fill="var(--accent-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="analytics-ticket-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("analytics.ticketAnalytics")}</span>
            <h2>{t("analytics.ticketAnalytics")}</h2>
          </div>
          <ReceiptText size={22} aria-hidden="true" />
        </div>
        <div className="analytics-overview-grid">
          <article>
            <span>{t("stats.totalApplications")}</span>
            <strong>{ticketStats.totalApplications}</strong>
          </article>
          <article>
            <span>{t("analytics.winRate")}</span>
            <strong>{ticketStats.winRate === null ? "N/A" : `${ticketStats.winRate}%`}</strong>
          </article>
          <article>
            <span>{t("analytics.totalPaidAmount")}</span>
            <strong>{formatCurrency(ticketStats.totalPaidAmount)}</strong>
          </article>
          <article>
            <span>{t("analytics.averageTicketPrice")}</span>
            <strong>{ticketStats.averageTicketPrice === null ? "N/A" : formatCurrency(ticketStats.averageTicketPrice)}</strong>
          </article>
        </div>
        <section className="analytics-grid analytics-grid--compact">
          <ChartCard
            title={t("analytics.applicationStatus")}
            emptyLabel={t("analytics.noTicketData")}
            isEmpty={statusData.length === 0}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="name" outerRadius="72%" paddingAngle={2}>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t("analytics.platformDistribution")}
            emptyLabel={t("analytics.noTicketData")}
            isEmpty={platformData.length === 0}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} width={32} />
                <Tooltip />
                <Bar dataKey="count" name={t("analytics.platformDistribution")} fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>
      </section>
    </section>
  );
}
