import type { WeatherInfo } from "../types/event";

export function weatherCodeToText(code: number) {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunder";
  return "Weather";
}

export function weatherCodeToKey(code: number) {
  if (code === 0) return "weather.clear";
  if ([1, 2, 3].includes(code)) return "weather.cloudy";
  if ([45, 48].includes(code)) return "weather.fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "weather.drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "weather.rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "weather.snow";
  if ([95, 96, 99].includes(code)) return "weather.thunder";
  return "weather.unknown";
}

export function formatWeatherSummary(weather: WeatherInfo) {
  return `${weather.temperature.toFixed(1)}°C · ${weatherCodeToText(
    weather.weatherCode,
  )} ${weather.precipitation.toFixed(1)}mm · Wind ${weather.windSpeed.toFixed(1)}km/h`;
}
