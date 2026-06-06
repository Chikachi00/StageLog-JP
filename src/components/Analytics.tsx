import { BarChart3, CloudRain, ReceiptText, Thermometer, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EventRecord, Venue } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import {
  getAverageTemperatureByMonth,
  getAverageTicketPriceByPlatform,
  getCumulativeTicketSpendingByMonth,
  getCumulativeEventsByMonth,
  getEventsByMonth,
  getEventsByRegion,
  getEventsByYear,
  getPrecipitationByMonth,
  getRainfallRanking,
  getTemperatureTrend,
  getTicketAnalytics,
  getTicketPlatformDistribution,
  getTicketSpendingByMonth,
  getTicketSpendingByPlatform,
  getTicketStatusDistribution,
  getTicketWinRateByPlatform,
  getTopArtists,
  getTopVenues,
  getWeatherConditionDistribution,
  getWeatherSummary,
  getWindSpeedRanking,
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
  fallbackData?: ChartDataListItem[];
  fallbackUnit?: string;
  children: ReactNode;
}

interface ChartDataListItem {
  name: string;
  count?: number;
}

interface ChartFrameProps {
  children: (width: number, height: number) => ReactNode;
  height?: number;
}

const CHART_HEIGHT = 280;
const FALLBACK_CHART_WIDTH = 560;
const AXIS_STROKE = "#8a98aa";
const axisTick = { fill: "var(--muted)", fontSize: 12, fontWeight: 700 };
const GRID_STROKE = "rgba(127, 141, 163, 0.32)";
const PRIMARY_COLOR = "#e84f7a";
const SECONDARY_COLOR = "#13a7a0";
const TERTIARY_COLOR = "#7f56d9";
const chartMargin = { top: 14, right: 18, bottom: 12, left: 0 };
const verticalChartMargin = { top: 14, right: 20, bottom: 12, left: 12 };
const tooltipContentStyle = {
  background: "var(--paper)",
  border: "1px solid var(--line)",
  borderRadius: "8px",
  color: "var(--ink)",
};

const roundOneDecimal = (value: number) => Math.round(value * 10) / 10;
const formatCurrency = (value: number) => `${Math.round(value).toLocaleString()} JPY`;
const formatPercent = (value: number) => `${roundOneDecimal(value)}%`;

const truncate = (value: string, maxLength = 18) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;

function ChartFrame({ children, height = CHART_HEIGHT }: ChartFrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(FALLBACK_CHART_WIDTH);

  useEffect(() => {
    const node = frameRef.current;

    if (!node) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = Math.floor(node.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setWidth(nextWidth);
      }
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="analytics-chart-frame" ref={frameRef} style={{ minHeight: height }}>
      {children(Math.max(width, 320), height)}
    </div>
  );
}

function ChartDataList({ data, unit = "", maxItems = 5 }: { data: ChartDataListItem[]; unit?: string; maxItems?: number }) {
  if (data.length === 0) {
    return null;
  }

  return (
    <ul className="chart-data-list" aria-label="Chart data preview">
      {data.slice(0, maxItems).map((item) => (
        <li key={item.name}>
          <span>{item.name}</span>
          <strong>
            {typeof item.count === "number" ? item.count.toLocaleString() : "N/A"}
            {unit}
          </strong>
        </li>
      ))}
    </ul>
  );
}

function ChartCard({ title, description, isEmpty, emptyLabel, fallbackData = [], fallbackUnit, children }: ChartCardProps) {
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
        <>
          <div className="analytics-chart-body">{children}</div>
          <ChartDataList data={fallbackData} unit={fallbackUnit} />
        </>
      )}
    </article>
  );
}

const eventLabel = (event: EventRecord | null, fallback: string, unit?: string, value?: number) => {
  if (!event) {
    return fallback;
  }

  const suffix = typeof value === "number" && unit ? ` - ${value.toFixed(1)}${unit}` : "";
  return `${event.title} - ${formatDate(event.date)}${suffix}`;
};

export function Analytics({ events, ticketApplications, venues }: AnalyticsProps) {
  const { t } = useTranslation();
  const eventsByYear = useMemo(() => getEventsByYear(events), [events]);
  const monthlyData = useMemo(() => getEventsByMonth(events), [events]);
  const cumulativeByMonth = useMemo(() => getCumulativeEventsByMonth(events), [events]);
  const topArtists = useMemo(() => getTopArtists(events), [events]);
  const topVenues = useMemo(() => getTopVenues(events), [events]);
  const regionData = useMemo(() => getEventsByRegion(events, venues), [events, venues]);
  const weatherSummary = useMemo(() => getWeatherSummary(events), [events]);
  const temperatureTrend = useMemo(() => getTemperatureTrend(events), [events]);
  const rainfallRanking = useMemo(() => getRainfallRanking(events), [events]);
  const weatherConditionData = useMemo(() => getWeatherConditionDistribution(events), [events]);
  const averageTemperatureByMonth = useMemo(() => getAverageTemperatureByMonth(events), [events]);
  const precipitationByMonth = useMemo(() => getPrecipitationByMonth(events), [events]);
  const windSpeedRanking = useMemo(() => getWindSpeedRanking(events), [events]);
  const ticketStats = useMemo(() => getTicketAnalytics(ticketApplications), [ticketApplications]);
  const ticketStatusDistribution = useMemo(() => getTicketStatusDistribution(ticketApplications), [ticketApplications]);
  const ticketPlatformDistribution = useMemo(() => getTicketPlatformDistribution(ticketApplications), [ticketApplications]);
  const ticketWinRateByPlatform = useMemo(() => getTicketWinRateByPlatform(ticketApplications), [ticketApplications]);
  const ticketSpendingByMonth = useMemo(() => getTicketSpendingByMonth(ticketApplications), [ticketApplications]);
  const cumulativeTicketSpending = useMemo(
    () => getCumulativeTicketSpendingByMonth(ticketApplications),
    [ticketApplications],
  );
  const ticketSpendingByPlatform = useMemo(() => getTicketSpendingByPlatform(ticketApplications), [ticketApplications]);
  const averageTicketPriceByPlatform = useMemo(
    () => getAverageTicketPriceByPlatform(ticketApplications),
    [ticketApplications],
  );
  const statusData = useMemo(
    () =>
      ticketStatusDistribution.map(({ name: status, count }) => ({
        name: t(`status.${status}`, { defaultValue: status }),
        count,
        shortName: truncate(t(`status.${status}`, { defaultValue: status }), 16),
      })),
    [t, ticketStatusDistribution],
  );
  const platformData = useMemo(
    () =>
      ticketPlatformDistribution.map(({ name: platform, count }) => ({
        name: t(`platform.${platform}`, { defaultValue: platform }),
        count,
        shortName: truncate(t(`platform.${platform}`, { defaultValue: platform }), 16),
      })),
    [t, ticketPlatformDistribution],
  );
  const topArtistChartData = useMemo(
    () => topArtists.map((item) => ({ ...item, shortName: truncate(item.name) })),
    [topArtists],
  );
  const topVenueChartData = useMemo(
    () => topVenues.map((item) => ({ ...item, shortName: truncate(item.name) })),
    [topVenues],
  );
  const regionChartData = useMemo(
    () => regionData.map((item) => ({ ...item, shortName: truncate(item.name, 16) })),
    [regionData],
  );
  const rainfallChartData = useMemo(
    () => rainfallRanking.map((item) => ({ ...item, shortName: truncate(item.name, 18) })),
    [rainfallRanking],
  );
  const weatherConditionChartData = useMemo(
    () =>
      weatherConditionData.map((item) => ({
        ...item,
        name: t(`analytics.weatherConditions.${item.name}`, { defaultValue: item.name }),
        shortName: truncate(t(`analytics.weatherConditions.${item.name}`, { defaultValue: item.name }), 16),
      })),
    [t, weatherConditionData],
  );
  const windSpeedChartData = useMemo(
    () => windSpeedRanking.map((item) => ({ ...item, shortName: truncate(item.name, 18) })),
    [windSpeedRanking],
  );
  const ticketWinRateChartData = useMemo(
    () =>
      ticketWinRateByPlatform.map((item) => ({
        ...item,
        name: t(`platform.${item.platform}`, { defaultValue: item.platform }),
        shortName: truncate(t(`platform.${item.platform}`, { defaultValue: item.platform }), 16),
      })),
    [t, ticketWinRateByPlatform],
  );
  const ticketSpendingByMonthFallback = useMemo(
    () => ticketSpendingByMonth.map((item) => ({ name: item.name, count: item.paidAmount })),
    [ticketSpendingByMonth],
  );
  const cumulativeTicketSpendingFallback = useMemo(
    () => cumulativeTicketSpending.map((item) => ({ name: item.name, count: item.cumulativePaid })),
    [cumulativeTicketSpending],
  );
  const ticketSpendingPlatformChartData = useMemo(
    () =>
      ticketSpendingByPlatform.map((item) => ({
        ...item,
        name: t(`platform.${item.platform}`, { defaultValue: item.platform }),
        shortName: truncate(t(`platform.${item.platform}`, { defaultValue: item.platform }), 16),
      })),
    [t, ticketSpendingByPlatform],
  );
  const averageTicketPricePlatformChartData = useMemo(
    () =>
      averageTicketPriceByPlatform.map((item) => ({
        ...item,
        name: t(`platform.${item.platform}`, { defaultValue: item.platform }),
        shortName: truncate(t(`platform.${item.platform}`, { defaultValue: item.platform }), 16),
      })),
    [t, averageTicketPriceByPlatform],
  );

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.debug("[Analytics data]", {
      eventsCount: events.length,
      yearlyData: eventsByYear,
      monthlyData,
      cumulativeMonthlyData: cumulativeByMonth,
      topArtists,
      topVenues,
      regionData,
      temperatureData: temperatureTrend,
      weatherConditionData,
      averageTemperatureByMonth,
      precipitationByMonth,
      windSpeedData: windSpeedRanking,
      ticketStatusData: statusData,
      ticketPlatformData: platformData,
      ticketWinRateByPlatform,
      ticketSpendingByMonth,
      cumulativeTicketSpending,
      ticketSpendingByPlatform,
      averageTicketPriceByPlatform,
    });
  }, [
    averageTemperatureByMonth,
    averageTicketPriceByPlatform,
    cumulativeTicketSpending,
    cumulativeByMonth,
    events.length,
    eventsByYear,
    monthlyData,
    platformData,
    precipitationByMonth,
    regionData,
    statusData,
    temperatureTrend,
    ticketSpendingByMonth,
    ticketSpendingByPlatform,
    ticketWinRateByPlatform,
    topArtists,
    topVenues,
    weatherConditionData,
    windSpeedRanking,
  ]);

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
              : `${weatherSummary.averageTemperature.toFixed(1)}\u00b0C`}
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
          fallbackData={eventsByYear}
          isEmpty={eventsByYear.length === 0}
        >
          <ChartFrame>
            {(width, height) => (
            <BarChart width={width} height={height} data={eventsByYear} margin={chartMargin} barCategoryGap="30%">
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
              <YAxis allowDecimals={false} axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} width={36} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Bar
                dataKey="count"
                fill={PRIMARY_COLOR}
                isAnimationActive={false}
                minPointSize={4}
                name={t("analytics.attendanceByYear")}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
            )}
          </ChartFrame>
        </ChartCard>

        <ChartCard
          title={t("analytics.monthlyAttendance")}
          description={t("analytics.cumulativeAttendance")}
          emptyLabel={t("analytics.noEventData")}
          fallbackData={cumulativeByMonth}
          isEmpty={cumulativeByMonth.length === 0}
        >
          <ChartFrame>
            {(width, height) => (
            <LineChart width={width} height={height} data={cumulativeByMonth} margin={chartMargin}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                minTickGap={16}
                axisLine={{ stroke: AXIS_STROKE }}
                tick={axisTick}
                tickLine={{ stroke: AXIS_STROKE }}
              />
              <YAxis allowDecimals={false} axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} width={36} />
              <Tooltip contentStyle={tooltipContentStyle} />
              <Legend />
              <Line
                activeDot={{ r: 6 }}
                dataKey="count"
                dot={{ r: 4, fill: SECONDARY_COLOR, strokeWidth: 0 }}
                isAnimationActive={false}
                name={t("analytics.monthlyAttendance")}
                stroke={SECONDARY_COLOR}
                strokeWidth={2.5}
                type="monotone"
              />
              <Line
                activeDot={{ r: 6 }}
                dataKey="cumulative"
                dot={{ r: 4, fill: PRIMARY_COLOR, strokeWidth: 0 }}
                isAnimationActive={false}
                name={t("analytics.cumulativeAttendance")}
                stroke={PRIMARY_COLOR}
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
            )}
          </ChartFrame>
        </ChartCard>

        <ChartCard
          title={t("analytics.topArtists")}
          emptyLabel={t("analytics.noEventData")}
          fallbackData={topArtists}
          isEmpty={topArtists.length === 0}
        >
          <ChartFrame>
            {(width, height) => (
            <BarChart width={width} height={height} data={topArtistChartData} layout="vertical" margin={verticalChartMargin} barCategoryGap="24%">
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
              <XAxis allowDecimals={false} axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} type="number" />
              <YAxis
                dataKey="shortName"
                axisLine={{ stroke: AXIS_STROKE }}
                tick={axisTick}
                tickLine={{ stroke: AXIS_STROKE }}
                type="category"
                width={108}
              />
              <Tooltip contentStyle={tooltipContentStyle} formatter={(value, _name, item) => [value, item.payload.name]} />
              <Bar
                dataKey="count"
                fill={PRIMARY_COLOR}
                isAnimationActive={false}
                minPointSize={4}
                name={t("analytics.topArtists")}
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
            )}
          </ChartFrame>
        </ChartCard>

        <ChartCard
          title={t("analytics.topVenues")}
          emptyLabel={t("analytics.noEventData")}
          fallbackData={topVenues}
          isEmpty={topVenues.length === 0}
        >
          <ChartFrame>
            {(width, height) => (
            <BarChart width={width} height={height} data={topVenueChartData} layout="vertical" margin={verticalChartMargin} barCategoryGap="24%">
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
              <XAxis allowDecimals={false} axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} type="number" />
              <YAxis
                dataKey="shortName"
                axisLine={{ stroke: AXIS_STROKE }}
                tick={axisTick}
                tickLine={{ stroke: AXIS_STROKE }}
                type="category"
                width={108}
              />
              <Tooltip contentStyle={tooltipContentStyle} formatter={(value, _name, item) => [value, item.payload.name]} />
              <Bar
                dataKey="count"
                fill={SECONDARY_COLOR}
                isAnimationActive={false}
                minPointSize={4}
                name={t("analytics.topVenues")}
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
            )}
          </ChartFrame>
        </ChartCard>

        <ChartCard
          title={t("analytics.regionDistribution")}
          emptyLabel={t("analytics.noEventData")}
          fallbackData={regionData}
          isEmpty={regionData.length === 0}
        >
          <ChartFrame>
            {(width, height) => (
            <BarChart width={width} height={height} data={regionChartData} margin={chartMargin} barCategoryGap="30%">
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="shortName" axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
              <YAxis allowDecimals={false} axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} width={36} />
              <Tooltip contentStyle={tooltipContentStyle} formatter={(value, _name, item) => [value, item.payload.name]} />
              <Bar
                dataKey="count"
                fill={TERTIARY_COLOR}
                isAnimationActive={false}
                minPointSize={4}
                name={t("analytics.regionDistribution")}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
            )}
          </ChartFrame>
        </ChartCard>

        <ChartCard
          title={t("analytics.temperatureTrend")}
          description={t("analytics.weatherAnalytics")}
          emptyLabel={`${t("analytics.noWeatherData")} ${t("analytics.fetchWeatherFirst")}`}
          fallbackData={temperatureTrend}
          fallbackUnit="\u00b0C"
          isEmpty={temperatureTrend.length === 0}
        >
          <ChartFrame>
            {(width, height) => (
            <LineChart width={width} height={height} data={temperatureTrend} margin={chartMargin}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                minTickGap={18}
                axisLine={{ stroke: AXIS_STROKE }}
                tick={axisTick}
                tickLine={{ stroke: AXIS_STROKE }}
              />
              <YAxis axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} unit="\u00b0C" width={44} />
              <Tooltip contentStyle={tooltipContentStyle} formatter={(value) => [`${value}\u00b0C`, t("analytics.averageTemperature")]} />
              <Line
                activeDot={{ r: 6 }}
                dataKey="count"
                dot={{ r: 4, fill: PRIMARY_COLOR, strokeWidth: 0 }}
                isAnimationActive={false}
                name={t("analytics.averageTemperature")}
                stroke={PRIMARY_COLOR}
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
            )}
          </ChartFrame>
        </ChartCard>
      </section>

      <section className="analytics-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("analytics.weatherAnalytics")}</span>
            <h2>{t("analytics.weatherAnalytics")}</h2>
          </div>
          <CloudRain size={22} aria-hidden="true" />
        </div>
        <section className="analytics-grid">
          <ChartCard
            title={t("analytics.weatherConditionDistribution")}
            emptyLabel={`${t("analytics.noWeatherData")} ${t("analytics.fetchWeatherFirst")}`}
            fallbackData={weatherConditionChartData}
            isEmpty={weatherConditionChartData.length === 0}
          >
            <ChartFrame>
              {(width, height) => (
                <BarChart width={width} height={height} data={weatherConditionChartData} margin={chartMargin} barCategoryGap="30%">
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="shortName" axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
                  <YAxis allowDecimals={false} axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} width={36} />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value, _name, item) => [value, item.payload.name]} />
                  <Bar
                    dataKey="count"
                    fill={TERTIARY_COLOR}
                    isAnimationActive={false}
                    minPointSize={4}
                    name={t("analytics.weatherConditionDistribution")}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ChartFrame>
          </ChartCard>

          <ChartCard
            title={t("analytics.averageTemperatureByMonth")}
            emptyLabel={`${t("analytics.noWeatherData")} ${t("analytics.fetchWeatherFirst")}`}
            fallbackData={averageTemperatureByMonth}
            fallbackUnit="\u00b0C"
            isEmpty={averageTemperatureByMonth.length === 0}
          >
            <ChartFrame>
              {(width, height) => (
                <LineChart width={width} height={height} data={averageTemperatureByMonth} margin={chartMargin}>
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    minTickGap={18}
                    axisLine={{ stroke: AXIS_STROKE }}
                    tick={axisTick}
                    tickLine={{ stroke: AXIS_STROKE }}
                  />
                  <YAxis axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} unit="\u00b0C" width={44} />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value) => [`${value}\u00b0C`, t("analytics.averageTemperature")]} />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="count"
                    dot={{ r: 4, fill: PRIMARY_COLOR, strokeWidth: 0 }}
                    isAnimationActive={false}
                    name={t("analytics.averageTemperature")}
                    stroke={PRIMARY_COLOR}
                    strokeWidth={2.5}
                    type="monotone"
                  />
                </LineChart>
              )}
            </ChartFrame>
          </ChartCard>

          <ChartCard
            title={t("analytics.monthlyPrecipitation")}
            emptyLabel={`${t("analytics.noWeatherData")} ${t("analytics.fetchWeatherFirst")}`}
            fallbackData={precipitationByMonth}
            fallbackUnit="mm"
            isEmpty={precipitationByMonth.length === 0}
          >
            <ChartFrame>
              {(width, height) => (
                <BarChart width={width} height={height} data={precipitationByMonth} margin={chartMargin} barCategoryGap="30%">
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
                  <YAxis axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} unit="mm" width={44} />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value) => [`${value}mm`, t("analytics.monthlyPrecipitation")]} />
                  <Bar
                    dataKey="count"
                    fill={SECONDARY_COLOR}
                    isAnimationActive={false}
                    minPointSize={4}
                    name={t("analytics.monthlyPrecipitation")}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ChartFrame>
          </ChartCard>

          <ChartCard
            title={t("analytics.windSpeedRanking")}
            emptyLabel={`${t("analytics.noWeatherData")} ${t("analytics.fetchWeatherFirst")}`}
            fallbackData={windSpeedRanking}
            fallbackUnit="km/h"
            isEmpty={windSpeedChartData.length === 0}
          >
            <ChartFrame>
              {(width, height) => (
                <BarChart width={width} height={height} data={windSpeedChartData} layout="vertical" margin={verticalChartMargin} barCategoryGap="24%">
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
                  <XAxis axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} type="number" unit="km/h" />
                  <YAxis
                    dataKey="shortName"
                    axisLine={{ stroke: AXIS_STROKE }}
                    tick={axisTick}
                    tickLine={{ stroke: AXIS_STROKE }}
                    type="category"
                    width={108}
                  />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value, _name, item) => [`${value}km/h`, item.payload.title]} />
                  <Bar
                    dataKey="count"
                    fill={PRIMARY_COLOR}
                    isAnimationActive={false}
                    minPointSize={4}
                    name={t("analytics.windSpeedRanking")}
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              )}
            </ChartFrame>
          </ChartCard>
        </section>
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
                    "\u00b0C",
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
                    "\u00b0C",
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
          fallbackData={rainfallRanking}
          fallbackUnit="mm"
          isEmpty={rainfallRanking.length === 0}
        >
          <ChartFrame>
            {(width, height) => (
            <BarChart width={width} height={height} data={rainfallChartData} margin={chartMargin} barCategoryGap="30%">
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="shortName" axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
              <YAxis axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} unit="mm" width={44} />
              <Tooltip contentStyle={tooltipContentStyle} formatter={(value, _name, item) => [`${value}mm`, item.payload.title]} />
              <Bar
                dataKey="count"
                fill={SECONDARY_COLOR}
                isAnimationActive={false}
                minPointSize={4}
                name={t("analytics.rainiestEvent")}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
            )}
          </ChartFrame>
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
            fallbackData={statusData}
            isEmpty={statusData.length === 0}
          >
            <ChartFrame>
              {(width, height) => (
              <BarChart width={width} height={height} data={statusData} margin={chartMargin} barCategoryGap="30%">
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shortName" axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
                <YAxis allowDecimals={false} axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} width={36} />
                <Tooltip contentStyle={tooltipContentStyle} formatter={(value, _name, item) => [value, item.payload.name]} />
                <Bar
                  dataKey="count"
                  fill={TERTIARY_COLOR}
                  isAnimationActive={false}
                  minPointSize={4}
                  name={t("analytics.applicationStatus")}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
              )}
            </ChartFrame>
          </ChartCard>

          <ChartCard
            title={t("analytics.platformDistribution")}
            emptyLabel={t("analytics.noTicketData")}
            fallbackData={platformData}
            isEmpty={platformData.length === 0}
          >
            <ChartFrame>
              {(width, height) => (
              <BarChart width={width} height={height} data={platformData} margin={chartMargin} barCategoryGap="30%">
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shortName" axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
                <YAxis allowDecimals={false} axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} width={36} />
                <Tooltip contentStyle={tooltipContentStyle} formatter={(value, _name, item) => [value, item.payload.name]} />
                <Bar
                  dataKey="count"
                  fill={PRIMARY_COLOR}
                  isAnimationActive={false}
                  minPointSize={4}
                  name={t("analytics.platformDistribution")}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
              )}
            </ChartFrame>
          </ChartCard>
        </section>

        <section className="analytics-grid analytics-grid--compact">
          <ChartCard
            title={t("analytics.ticketWinRateByPlatform")}
            emptyLabel={t("analytics.noResolvedTicketData")}
            fallbackData={ticketWinRateChartData}
            fallbackUnit="%"
            isEmpty={!ticketWinRateByPlatform.some((item) => item.resolved > 0)}
          >
            <ChartFrame>
              {(width, height) => (
                <BarChart width={width} height={height} data={ticketWinRateChartData} margin={chartMargin} barCategoryGap="30%">
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="shortName" axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
                  <YAxis axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} unit="%" width={44} />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    formatter={(value, _name, item) => [
                      `${formatPercent(Number(value))} / ${t("analytics.applications")}: ${item.payload.applications}, ${t(
                        "analytics.won",
                      )}: ${item.payload.won}, ${t("analytics.lost")}: ${item.payload.lost}, ${t("analytics.resolved")}: ${
                        item.payload.resolved
                      }`,
                      item.payload.name,
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    fill={SECONDARY_COLOR}
                    isAnimationActive={false}
                    minPointSize={4}
                    name={t("analytics.ticketWinRateByPlatform")}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ChartFrame>
          </ChartCard>

          <ChartCard
            title={t("analytics.monthlyTicketSpending")}
            emptyLabel={t("analytics.noSpendingData")}
            fallbackData={ticketSpendingByMonthFallback}
            fallbackUnit=" JPY"
            isEmpty={ticketSpendingByMonth.length === 0}
          >
            <ChartFrame>
              {(width, height) => (
                <BarChart width={width} height={height} data={ticketSpendingByMonth} margin={chartMargin} barCategoryGap="24%">
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
                  <YAxis axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} width={72} />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                  <Legend />
                  <Bar
                    dataKey="paidAmount"
                    fill={PRIMARY_COLOR}
                    isAnimationActive={false}
                    minPointSize={4}
                    name={t("analytics.paidAmount")}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="plannedAmount"
                    fill={TERTIARY_COLOR}
                    isAnimationActive={false}
                    minPointSize={4}
                    name={t("analytics.plannedAmount")}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ChartFrame>
          </ChartCard>

          <ChartCard
            title={t("analytics.cumulativeTicketSpending")}
            emptyLabel={t("analytics.noSpendingData")}
            fallbackData={cumulativeTicketSpendingFallback}
            fallbackUnit=" JPY"
            isEmpty={cumulativeTicketSpending.length === 0}
          >
            <ChartFrame>
              {(width, height) => (
                <LineChart width={width} height={height} data={cumulativeTicketSpending} margin={chartMargin}>
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" minTickGap={18} axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
                  <YAxis axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} width={72} />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                  <Legend />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="cumulativePaid"
                    dot={{ r: 4, fill: PRIMARY_COLOR, strokeWidth: 0 }}
                    isAnimationActive={false}
                    name={t("analytics.cumulativePaid")}
                    stroke={PRIMARY_COLOR}
                    strokeWidth={2.5}
                    type="monotone"
                  />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="cumulativePlanned"
                    dot={{ r: 4, fill: TERTIARY_COLOR, strokeWidth: 0 }}
                    isAnimationActive={false}
                    name={t("analytics.cumulativePlanned")}
                    stroke={TERTIARY_COLOR}
                    strokeWidth={2.5}
                    type="monotone"
                  />
                </LineChart>
              )}
            </ChartFrame>
          </ChartCard>

          <ChartCard
            title={t("analytics.spendingByPlatform")}
            emptyLabel={t("analytics.noSpendingData")}
            fallbackData={ticketSpendingPlatformChartData}
            fallbackUnit=" JPY"
            isEmpty={ticketSpendingByPlatform.length === 0}
          >
            <ChartFrame>
              {(width, height) => (
                <BarChart
                  width={width}
                  height={height}
                  data={ticketSpendingPlatformChartData}
                  layout="vertical"
                  margin={verticalChartMargin}
                  barCategoryGap="20%"
                >
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
                  <XAxis axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} type="number" />
                  <YAxis
                    dataKey="shortName"
                    axisLine={{ stroke: AXIS_STROKE }}
                    tick={axisTick}
                    tickLine={{ stroke: AXIS_STROKE }}
                    type="category"
                    width={108}
                  />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                  <Legend />
                  <Bar
                    dataKey="paidAmount"
                    fill={PRIMARY_COLOR}
                    isAnimationActive={false}
                    minPointSize={4}
                    name={t("analytics.paidAmount")}
                    radius={[0, 6, 6, 0]}
                  />
                  <Bar
                    dataKey="plannedAmount"
                    fill={SECONDARY_COLOR}
                    isAnimationActive={false}
                    minPointSize={4}
                    name={t("analytics.plannedAmount")}
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              )}
            </ChartFrame>
          </ChartCard>

          <ChartCard
            title={t("analytics.averageTicketPriceByPlatform")}
            emptyLabel={t("analytics.noTicketPriceData")}
            fallbackData={averageTicketPricePlatformChartData}
            fallbackUnit=" JPY"
            isEmpty={averageTicketPriceByPlatform.length === 0}
          >
            <ChartFrame>
              {(width, height) => (
                <BarChart width={width} height={height} data={averageTicketPricePlatformChartData} margin={chartMargin} barCategoryGap="30%">
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="shortName" axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} />
                  <YAxis axisLine={{ stroke: AXIS_STROKE }} tick={axisTick} tickLine={{ stroke: AXIS_STROKE }} width={72} />
                  <Tooltip contentStyle={tooltipContentStyle} formatter={(value, _name, item) => [formatCurrency(Number(value)), item.payload.name]} />
                  <Bar
                    dataKey="count"
                    fill={TERTIARY_COLOR}
                    isAnimationActive={false}
                    minPointSize={4}
                    name={t("analytics.averageTicketPriceByPlatform")}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ChartFrame>
          </ChartCard>
        </section>
      </section>
    </section>
  );
}
