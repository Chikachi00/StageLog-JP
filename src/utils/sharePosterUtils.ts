import type { EventRecord } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import { formatCurrencyAmount, getTicketDisplayAmountForStats, getTicketDisplayCurrency } from "./ticketUtils";

export const SHARE_POSTER_MAX_EVENTS = 12;
export const STAGELOG_GITHUB_URL = "https://github.com/Chikachi00/StageLog-JP";

export type SharePosterMode = "selected" | "yearly";
export type SharePosterTheme = "sakura" | "ocean" | "night" | "classic";

export interface SharePosterPrivacyOptions {
  showSeat: boolean;
  showPrice: boolean;
  showNotes: boolean;
  showWeather: boolean;
  showAttribution: boolean;
  showTicketType: boolean;
}

export interface SharePosterText {
  generatedBy: string;
  selectedHeading: string;
  yearlyHeading: string;
  selectedSubtitle: string;
  liveEvents: string;
  unlockedCities: string;
  unlockedVenues: string;
  countries: string;
  ticketRounds: string;
  mostVisitedCity: string;
  mostVisitedVenue: string;
  firstLive: string;
  latestLive: string;
  weatherRecords: string;
  moreMemories: (count: number) => string;
  noData: string;
  doors: string;
  start: string;
  seat: string;
  ticketType: string;
  notes: string;
  weather: string;
  price: string;
}

export interface YearlySharePosterStats {
  year: string;
  eventCount: number;
  cityCount: number;
  venueCount: number;
  countryCount: number;
  ticketRoundCount: number;
  paidSpendingLabel: string;
  mostVisitedCity: string;
  mostVisitedVenue: string;
  firstLive?: EventRecord;
  latestLive?: EventRecord;
  weatherRecordCount: number;
}

const isValidYear = (value: string) => /^\d{4}$/.test(value);

export const getSharePosterYears = (events: EventRecord[]) =>
  Array.from(new Set(events.map((event) => event.date.slice(0, 4)).filter(isValidYear))).sort((a, b) =>
    b.localeCompare(a),
  );

export const getDefaultSharePosterYear = (events: EventRecord[]) =>
  getSharePosterYears(events)[0] ?? String(new Date().getFullYear());

export const getEventsForSharePosterYear = (events: EventRecord[], year: string) =>
  events.filter((event) => event.date.startsWith(year));

export const sortPosterEvents = (events: EventRecord[]) =>
  [...events].sort((first, second) => {
    const left = `${first.date || "0000-00-00"}T${first.startTime || "00:00"}`;
    const right = `${second.date || "0000-00-00"}T${second.startTime || "00:00"}`;
    return right.localeCompare(left);
  });

const getUniqueCount = (values: string[]) =>
  new Set(values.map((value) => value.trim()).filter(Boolean)).size;

const getTopValue = (values: string[], fallback: string) => {
  const counts = values.reduce<Record<string, number>>((accumulator, value) => {
    const normalized = value.trim();

    if (!normalized) {
      return accumulator;
    }

    accumulator[normalized] = (accumulator[normalized] ?? 0) + 1;
    return accumulator;
  }, {});

  const [top] = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return top ? top[0] : fallback;
};

export const getEventLocationLabel = (event: EventRecord) =>
  [event.city, event.country].filter(Boolean).join(", ");

export const getEventVenueKey = (event: EventRecord) =>
  [event.venueName, event.city].filter(Boolean).join(" / ");

export const getEventCityKey = (event: EventRecord) =>
  [event.city, event.country].filter(Boolean).join(" / ");

export const getSeatSummary = (event: EventRecord) => {
  const parts = [
    event.seat?.gate,
    event.seat?.level,
    event.seat?.block,
    event.seat?.row ? `Row ${event.seat.row}` : "",
    event.seat?.number ? `No. ${event.seat.number}` : "",
  ].filter(Boolean);

  return parts.join(" / ");
};

export const getEventCode = (event: EventRecord) =>
  `SL-${event.id.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "MEMORY"}`;

export const sanitizePosterText = (value: unknown) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

export const truncatePosterText = (value: string, maxLength: number) => {
  const normalized = sanitizePosterText(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
};

export const formatPosterDate = (date: string) => {
  if (!date) {
    return "Unknown date";
  }

  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${year}.${month}.${day}`;
};

export const getPosterDateRange = (events: EventRecord[]) => {
  const validDates = events.map((event) => event.date).filter(Boolean).sort();

  if (validDates.length === 0) {
    return "";
  }

  const startYear = validDates[0].slice(0, 4);
  const endYear = validDates[validDates.length - 1].slice(0, 4);

  return startYear === endYear ? startYear : `${startYear}-${endYear}`;
};

export const getTicketRoundCountForYear = (ticketApplications: TicketApplication[], year: string) =>
  ticketApplications.filter((application) => application.eventDate?.startsWith(year)).length;

export const buildYearlySharePosterStats = (
  eventsInYear: EventRecord[],
  ticketApplications: TicketApplication[],
  year: string,
  noDataLabel: string,
): YearlySharePosterStats => {
  const sortedAsc = [...eventsInYear].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
  const cityKeys = eventsInYear.map(getEventCityKey);
  const venueKeys = eventsInYear.map(getEventVenueKey);
  const ticketsInYear = ticketApplications.filter((application) => application.eventDate?.startsWith(year));
  const spendingCurrency = ticketsInYear.find((application) => getTicketDisplayAmountForStats(application))
    ? getTicketDisplayCurrency(ticketsInYear.find((application) => getTicketDisplayAmountForStats(application))!)
    : "CNY";
  const paidSpending = ticketsInYear.reduce((sum, application) => {
    if (getTicketDisplayCurrency(application) !== spendingCurrency) {
      return sum;
    }

    return sum + (getTicketDisplayAmountForStats(application) ?? 0);
  }, 0);

  return {
    year,
    eventCount: eventsInYear.length,
    cityCount: getUniqueCount(cityKeys),
    venueCount: getUniqueCount(venueKeys),
    countryCount: getUniqueCount(eventsInYear.map((event) => event.country)),
    ticketRoundCount: ticketsInYear.length,
    paidSpendingLabel: paidSpending > 0 ? formatCurrencyAmount(paidSpending, spendingCurrency) : noDataLabel,
    mostVisitedCity: getTopValue(cityKeys, noDataLabel),
    mostVisitedVenue: getTopValue(venueKeys, noDataLabel),
    firstLive: sortedAsc[0],
    latestLive: sortedAsc[sortedAsc.length - 1],
    weatherRecordCount: eventsInYear.filter((event) => event.weather).length,
  };
};
