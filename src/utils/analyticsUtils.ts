import type { EventRecord, Venue } from "../types/event";
import type { CurrencyCode, TicketApplication, TicketPlatform } from "../types/ticket";
import { countByValue, getTicketApplicationStats } from "./statisticsUtils";
import {
  getAppliedQuantity,
  getTicketAmountDisplay,
  getTicketDisplayAmountForStats,
  getTicketDisplayCurrency,
  getWonQuantity,
  isResolvedTicketRound,
  isWonTicketRound,
  paidStatuses,
} from "./ticketUtils";

export interface CountDatum {
  name: string;
  count: number;
}

export interface YearDatum extends CountDatum {
  year: string;
}

export interface MonthDatum extends CountDatum {
  month: string;
}

export interface CumulativeMonthDatum extends MonthDatum {
  cumulative: number;
}

export interface WeatherMonthlyDatum extends CountDatum {
  month: string;
  temperature?: number;
  precipitation?: number;
}

export interface WeatherEventDatum {
  name: string;
  date: string;
  title: string;
  artist: string;
  venueName: string;
  count?: number;
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
}

export interface TicketWinRateDatum extends CountDatum {
  platform: string;
  applications: number;
  won: number;
  lost: number;
  resolved: number;
  winRate: number;
  appliedQuantity: number;
  wonQuantity: number;
  quantityWinRate: number;
  roundWinRate: number;
}

export interface TicketSpendingDatum extends CountDatum {
  month?: string;
  platform?: string;
  currency: CurrencyCode;
  paidAmount: number;
  plannedAmount: number;
}

export interface CumulativeTicketSpendingDatum extends TicketSpendingDatum {
  month: string;
  cumulativePaid: number;
  cumulativePlanned: number;
}

export interface AverageTicketPriceDatum extends CountDatum {
  platform: string;
  currency: CurrencyCode;
  averagePrice: number;
}

export interface WeatherSummary {
  averageTemperature: number | null;
  hottestEvent: EventRecord | null;
  coldestEvent: EventRecord | null;
  rainiestEvent: EventRecord | null;
  windiestEvent: EventRecord | null;
  weatherDataCount: number;
}

const countEntries = (items: EventRecord[], getValue: (event: EventRecord) => string | undefined) =>
  Object.entries(
    items.reduce<Record<string, number>>((result, event) => {
      const name = getValue(event)?.trim() || "Unknown";
      result[name] = (result[name] ?? 0) + 1;
      return result;
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));

const getValidDatePrefix = (date: string, length: number) => {
  const prefix = date.slice(0, length);
  return /^\d{4}(-\d{2})?$/.test(prefix) ? prefix : "Unknown";
};

const getValidMonth = (date?: string) => {
  if (!date) {
    return null;
  }

  const month = date.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(month) ? month : null;
};

const roundOneDecimal = (value: number) => Math.round(value * 10) / 10;

const maxWeatherEvent = (
  events: EventRecord[],
  getValue: (event: EventRecord) => number | undefined,
) =>
  events
    .filter((event) => typeof getValue(event) === "number")
    .sort((first, second) => (getValue(second) ?? -Infinity) - (getValue(first) ?? -Infinity))[0] ?? null;

const minWeatherEvent = (
  events: EventRecord[],
  getValue: (event: EventRecord) => number | undefined,
) =>
  events
    .filter((event) => typeof getValue(event) === "number")
    .sort((first, second) => (getValue(first) ?? Infinity) - (getValue(second) ?? Infinity))[0] ?? null;

export const getEventsByYear = (events: EventRecord[]): YearDatum[] =>
  Object.entries(countByValue(events, (event) => getValidDatePrefix(event.date, 4)))
    .map(([year, count]) => ({ name: year, year, count }))
    .sort((first, second) => first.year.localeCompare(second.year));

export const getEventsByMonth = (events: EventRecord[]): MonthDatum[] =>
  Object.entries(countByValue(events, (event) => getValidDatePrefix(event.date, 7)))
    .map(([month, count]) => ({ name: month, month, count }))
    .sort((first, second) => first.month.localeCompare(second.month));

export const getCumulativeEventsByMonth = (events: EventRecord[]): CumulativeMonthDatum[] => {
  let cumulative = 0;

  return getEventsByMonth(events).map((item) => {
    cumulative += item.count;
    return { ...item, cumulative };
  });
};

export const getTopArtists = (events: EventRecord[], limit = 10): CountDatum[] =>
  countEntries(events, (event) => event.artist).slice(0, limit);

export const getTopVenues = (events: EventRecord[], limit = 10): CountDatum[] =>
  countEntries(events, (event) => event.venueName).slice(0, limit);

export const getEventsByRegion = (events: EventRecord[], venues: Venue[]): CountDatum[] => {
  const venueById = new Map(venues.map((venue) => [venue.id, venue]));

  return countEntries(events, (event) => {
    const venue = venueById.get(event.venueId);
    return venue?.region || venue?.prefecture || venue?.city || event.city || "Unknown";
  });
};

export const getWeatherSummary = (events: EventRecord[]): WeatherSummary => {
  const weatherEvents = events.filter((event) => event.weather);
  const temperatures = weatherEvents
    .map((event) => event.weather?.temperature)
    .filter((temperature): temperature is number => typeof temperature === "number");

  return {
    averageTemperature:
      temperatures.length > 0
        ? Math.round((temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length) * 10) / 10
        : null,
    hottestEvent: maxWeatherEvent(events, (event) => event.weather?.temperature),
    coldestEvent: minWeatherEvent(events, (event) => event.weather?.temperature),
    rainiestEvent: maxWeatherEvent(events, (event) => event.weather?.precipitation),
    windiestEvent: maxWeatherEvent(events, (event) => event.weather?.windSpeed),
    weatherDataCount: weatherEvents.length,
  };
};

export const getTemperatureTrend = (events: EventRecord[]): WeatherEventDatum[] =>
  events
    .filter((event) => typeof event.weather?.temperature === "number")
    .map((event) => ({
      name: event.date,
      date: event.date,
      title: event.title,
      artist: event.artist,
      venueName: event.venueName,
      count: event.weather?.temperature,
      temperature: event.weather?.temperature,
      precipitation: event.weather?.precipitation,
      windSpeed: event.weather?.windSpeed,
    }))
    .sort((first, second) => first.date.localeCompare(second.date));

export const getRainfallRanking = (events: EventRecord[], limit = 8): WeatherEventDatum[] =>
  events
    .filter((event) => typeof event.weather?.precipitation === "number")
    .map((event) => ({
      name: event.title || event.date,
      date: event.date,
      title: event.title,
      artist: event.artist,
      venueName: event.venueName,
      count: event.weather?.precipitation,
      precipitation: event.weather?.precipitation,
    }))
    .sort((first, second) => (second.precipitation ?? 0) - (first.precipitation ?? 0))
    .slice(0, limit);

const classifyWeather = (event: EventRecord) => {
  const weather = event.weather;

  if (!weather) {
    return null;
  }

  if (typeof weather.weatherCode === "number") {
    if ((weather.weatherCode >= 51 && weather.weatherCode <= 67) || weather.weatherCode >= 80) {
      return "Rain";
    }

    if (weather.weatherCode >= 71 && weather.weatherCode <= 77) {
      return "Cold";
    }

    if (weather.weatherCode >= 0 && weather.weatherCode <= 3) {
      if (typeof weather.temperature === "number" && weather.temperature >= 30) {
        return "Hot";
      }
      if (typeof weather.temperature === "number" && weather.temperature <= 5) {
        return "Cold";
      }
      if (typeof weather.windSpeed === "number" && weather.windSpeed >= 25) {
        return "Windy";
      }
      return "Clear / Normal";
    }
  }

  if (typeof weather.precipitation === "number" && weather.precipitation > 0) {
    return "Rain";
  }
  if (typeof weather.temperature === "number" && weather.temperature >= 30) {
    return "Hot";
  }
  if (typeof weather.temperature === "number" && weather.temperature <= 5) {
    return "Cold";
  }
  if (typeof weather.windSpeed === "number" && weather.windSpeed >= 25) {
    return "Windy";
  }

  return "Clear / Normal";
};

export const getWeatherConditionDistribution = (events: EventRecord[]): CountDatum[] =>
  Object.entries(
    events.reduce<Record<string, number>>((result, event) => {
      const condition = classifyWeather(event);

      if (!condition) {
        return result;
      }

      result[condition] = (result[condition] ?? 0) + 1;
      return result;
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));

export const getAverageTemperatureByMonth = (events: EventRecord[]): WeatherMonthlyDatum[] => {
  const grouped = events.reduce<Record<string, { total: number; count: number }>>((result, event) => {
    const month = getValidMonth(event.date);
    const temperature = event.weather?.temperature;

    if (!month || typeof temperature !== "number") {
      return result;
    }

    const current = result[month] ?? { total: 0, count: 0 };
    current.total += temperature;
    current.count += 1;
    result[month] = current;
    return result;
  }, {});

  return Object.entries(grouped)
    .map(([month, value]) => {
      const temperature = roundOneDecimal(value.total / value.count);
      return { name: month, month, count: temperature, temperature };
    })
    .sort((first, second) => first.month.localeCompare(second.month));
};

export const getPrecipitationByMonth = (events: EventRecord[]): WeatherMonthlyDatum[] => {
  const grouped = events.reduce<Record<string, number>>((result, event) => {
    const month = getValidMonth(event.date);
    const precipitation = event.weather?.precipitation;

    if (!month || typeof precipitation !== "number") {
      return result;
    }

    result[month] = (result[month] ?? 0) + precipitation;
    return result;
  }, {});

  return Object.entries(grouped)
    .map(([month, precipitation]) => ({
      name: month,
      month,
      count: roundOneDecimal(precipitation),
      precipitation: roundOneDecimal(precipitation),
    }))
    .sort((first, second) => first.month.localeCompare(second.month));
};

export const getWindSpeedRanking = (events: EventRecord[], limit = 8): WeatherEventDatum[] =>
  events
    .filter((event) => typeof event.weather?.windSpeed === "number")
    .map((event) => ({
      name: event.title || event.date,
      date: event.date,
      title: event.title,
      artist: event.artist,
      venueName: event.venueName,
      count: event.weather?.windSpeed,
      windSpeed: event.weather?.windSpeed,
    }))
    .sort((first, second) => (second.windSpeed ?? 0) - (first.windSpeed ?? 0))
    .slice(0, limit);

export const getTicketAnalytics = (ticketApplications: TicketApplication[]) =>
  getTicketApplicationStats(ticketApplications);

export const getTicketStatusDistribution = (ticketApplications: TicketApplication[]): CountDatum[] =>
  Object.entries(countByValue(ticketApplications, (application) => application.status))
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));

export const getTicketPlatformDistribution = (ticketApplications: TicketApplication[]): CountDatum[] =>
  Object.entries(countByValue(ticketApplications, (application) => application.platform))
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));

export const getTicketWinRateByPlatform = (ticketApplications: TicketApplication[]): TicketWinRateDatum[] => {
  const grouped = ticketApplications.reduce<
    Record<
      TicketPlatform,
      {
        applications: number;
        won: number;
        lost: number;
        resolved: number;
        appliedQuantity: number;
        wonQuantity: number;
        wonRounds: number;
      }
    >
  >((result, application) => {
    const platform = application.platform;
    const current = result[platform] ?? {
      applications: 0,
      won: 0,
      lost: 0,
      resolved: 0,
      appliedQuantity: 0,
      wonQuantity: 0,
      wonRounds: 0,
    };
    current.applications += 1;
    current.appliedQuantity += getAppliedQuantity(application);
    current.wonQuantity += getWonQuantity(application);
    if (isResolvedTicketRound(application)) {
      current.resolved += 1;
    }
    if (isWonTicketRound(application)) {
      current.won += 1;
      current.wonRounds += isResolvedTicketRound(application) ? 1 : 0;
    }
    if (application.status === "lost") {
      current.lost += 1;
    }
    result[platform] = current;
    return result;
  }, {} as Record<TicketPlatform, { applications: number; won: number; lost: number; resolved: number; appliedQuantity: number; wonQuantity: number; wonRounds: number }>);

  return Object.entries(grouped)
    .map(([platform, value]) => {
      const quantityWinRate =
        value.appliedQuantity > 0 ? roundOneDecimal((value.wonQuantity / value.appliedQuantity) * 100) : 0;
      const roundWinRate = value.resolved > 0 ? roundOneDecimal((value.wonRounds / value.resolved) * 100) : 0;
      return {
        name: platform,
        platform,
        applications: value.applications,
        won: value.won,
        lost: value.lost,
        resolved: value.resolved,
        count: quantityWinRate,
        winRate: quantityWinRate,
        appliedQuantity: value.appliedQuantity,
        wonQuantity: value.wonQuantity,
        quantityWinRate,
        roundWinRate,
      };
    })
    .sort((first, second) => second.quantityWinRate - first.quantityWinRate || first.name.localeCompare(second.name));
};

const shouldCountPlannedSpending = (application: TicketApplication) =>
  !["lost", "cancelled"].includes(application.status);

const getPrimaryDisplayCurrency = (ticketApplications: TicketApplication[]): CurrencyCode =>
  ticketApplications[0] ? getTicketDisplayCurrency(ticketApplications[0]) : "CNY";

export const getTicketSpendingByMonth = (ticketApplications: TicketApplication[]): TicketSpendingDatum[] => {
  const primaryCurrency = getPrimaryDisplayCurrency(ticketApplications);
  const grouped = ticketApplications.reduce<Record<string, { paidAmount: number; plannedAmount: number }>>(
    (result, application) => {
      const month = getValidMonth(application.eventDate) ?? getValidMonth(application.applicationDate);
      const amount = getTicketDisplayAmountForStats(application);

      if (!month || amount === undefined || getTicketDisplayCurrency(application) !== primaryCurrency) {
        return result;
      }

      const current = result[month] ?? { paidAmount: 0, plannedAmount: 0 };
      if (paidStatuses.includes(application.status)) {
        current.paidAmount += amount;
      }
      if (shouldCountPlannedSpending(application)) {
        current.plannedAmount += amount;
      }
      result[month] = current;
      return result;
    },
    {},
  );

  return Object.entries(grouped)
    .map(([month, value]) => ({
      name: month,
      month,
      currency: primaryCurrency,
      paidAmount: value.paidAmount,
      plannedAmount: value.plannedAmount,
      count: value.paidAmount,
    }))
    .sort((first, second) => (first.month ?? "").localeCompare(second.month ?? ""));
};

export const getCumulativeTicketSpendingByMonth = (
  ticketApplications: TicketApplication[],
): CumulativeTicketSpendingDatum[] => {
  let cumulativePaid = 0;
  let cumulativePlanned = 0;

  return getTicketSpendingByMonth(ticketApplications).map((item) => {
    cumulativePaid += item.paidAmount;
    cumulativePlanned += item.plannedAmount;
    return {
      ...item,
      month: item.month ?? item.name,
      cumulativePaid,
      cumulativePlanned,
      count: item.paidAmount,
    };
  });
};

export const getTicketSpendingByPlatform = (ticketApplications: TicketApplication[]): TicketSpendingDatum[] => {
  const primaryCurrency = getPrimaryDisplayCurrency(ticketApplications);
  const grouped = ticketApplications.reduce<Record<string, { paidAmount: number; plannedAmount: number }>>(
    (result, application) => {
      const amount = getTicketDisplayAmountForStats(application);

      if (amount === undefined || getTicketDisplayCurrency(application) !== primaryCurrency) {
        return result;
      }

      const platform = application.platform;
      const current = result[platform] ?? { paidAmount: 0, plannedAmount: 0 };
      if (paidStatuses.includes(application.status)) {
        current.paidAmount += amount;
      }
      if (shouldCountPlannedSpending(application)) {
        current.plannedAmount += amount;
      }
      result[platform] = current;
      return result;
    },
    {},
  );

  return Object.entries(grouped)
    .map(([platform, value]) => ({
      name: platform,
      platform,
      currency: primaryCurrency,
      paidAmount: value.paidAmount,
      plannedAmount: value.plannedAmount,
      count: value.paidAmount,
    }))
    .sort((first, second) => second.paidAmount - first.paidAmount || first.name.localeCompare(second.name));
};

export const getAverageTicketPriceByPlatform = (
  ticketApplications: TicketApplication[],
): AverageTicketPriceDatum[] => {
  const primaryCurrency = getPrimaryDisplayCurrency(ticketApplications);
  const grouped = ticketApplications.reduce<Record<string, { total: number; count: number }>>((result, application) => {
    const amount =
      typeof application.unitPriceOriginal === "number" && getTicketDisplayCurrency(application) === primaryCurrency
        ? application.unitPriceOriginal
        : typeof application.price === "number" && getTicketDisplayCurrency(application) === primaryCurrency
          ? application.price
          : typeof getTicketAmountDisplay(application) === "number" && getTicketDisplayCurrency(application) === primaryCurrency
            ? (getTicketAmountDisplay(application) ?? 0) /
              Math.max(getWonQuantity(application) || getAppliedQuantity(application) || application.quantity || 1, 1)
            : undefined;

    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      return result;
    }

    const platform = application.platform;
    const current = result[platform] ?? { total: 0, count: 0 };
    current.total += amount;
    current.count += 1;
    result[platform] = current;
    return result;
  }, {});

  return Object.entries(grouped)
    .map(([platform, value]) => {
      const averagePrice = roundOneDecimal(value.total / value.count);
      return {
        name: platform,
        platform,
        currency: primaryCurrency,
        averagePrice,
        count: averagePrice,
      };
    })
    .sort((first, second) => second.averagePrice - first.averagePrice || first.name.localeCompare(second.name));
};
