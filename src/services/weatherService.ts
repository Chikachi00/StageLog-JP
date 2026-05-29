import type { EventRecord, Venue, WeatherInfo } from "../types/event";

interface OpenMeteoArchiveResponse {
  hourly?: {
    time?: string[];
    temperature_2m?: Array<number | null>;
    precipitation?: Array<number | null>;
    wind_speed_10m?: Array<number | null>;
    weather_code?: Array<number | null>;
  };
  reason?: string;
}

const WEATHER_UNAVAILABLE_MESSAGE = "Weather data is only available after the event date.";

const isFutureDate = (date: string) => {
  const todayKey = new Date().toISOString().slice(0, 10);
  return date > todayKey;
};

const getTargetTime = (event: EventRecord) => `${event.date}T${event.startTime || "12:00"}`;

const findClosestHourIndex = (times: string[], targetTime: string) => {
  const target = new Date(targetTime).getTime();

  return times.reduce(
    (best, time, index) => {
      const distance = Math.abs(new Date(time).getTime() - target);
      return distance < best.distance ? { index, distance } : best;
    },
    { index: 0, distance: Number.POSITIVE_INFINITY },
  ).index;
};

const readNumber = (value: number | null | undefined, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export async function fetchWeatherForEvent(
  event: EventRecord,
  venue?: Venue,
): Promise<WeatherInfo> {
  if (!venue) {
    throw new Error("Venue is required to fetch weather.");
  }

  if (isFutureDate(event.date)) {
    throw new Error(WEATHER_UNAVAILABLE_MESSAGE);
  }

  const params = new URLSearchParams({
    latitude: String(venue.latitude),
    longitude: String(venue.longitude),
    start_date: event.date,
    end_date: event.date,
    hourly: "temperature_2m,precipitation,wind_speed_10m,weather_code",
    timezone: "Asia/Tokyo",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });

  let response: Response;

  try {
    response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params.toString()}`);
  } catch {
    throw new Error("Unable to fetch weather right now. Please check your network connection.");
  }

  let payload: OpenMeteoArchiveResponse;

  try {
    payload = (await response.json()) as OpenMeteoArchiveResponse;
  } catch {
    throw new Error("Weather service returned an unreadable response.");
  }

  if (!response.ok) {
    throw new Error(payload.reason || `Weather request failed with status ${response.status}.`);
  }

  const hourly = payload.hourly;

  if (!hourly?.time?.length) {
    throw new Error("No hourly weather data was returned for this event.");
  }

  const index = findClosestHourIndex(hourly.time, getTargetTime(event));
  const temperature = readNumber(hourly.temperature_2m?.[index], Number.NaN);

  if (!Number.isFinite(temperature)) {
    throw new Error("No temperature data was returned for the selected event time.");
  }

  return {
    temperature,
    precipitation: readNumber(hourly.precipitation?.[index]),
    windSpeed: readNumber(hourly.wind_speed_10m?.[index]),
    weatherCode: readNumber(hourly.weather_code?.[index]),
    fetchedAt: new Date().toISOString(),
  };
}
