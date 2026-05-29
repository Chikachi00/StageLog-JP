import type { StageEvent, WeatherCondition } from "../types/event";

export const weatherLabels: Record<WeatherCondition, string> = {
  sunny: "Sunny",
  cloudy: "Cloudy",
  rainy: "Rainy",
  snowy: "Snowy",
  windy: "Windy",
};

export const rankWeatherConditions = (events: StageEvent[]) => {
  const counts = events.reduce<Record<WeatherCondition, number>>(
    (result, event) => {
      if (event.weather) {
        result[event.weather] += 1;
      }

      return result;
    },
    {
      sunny: 0,
      cloudy: 0,
      rainy: 0,
      snowy: 0,
      windy: 0,
    },
  );

  return Object.entries(counts)
    .map(([condition, count]) => ({
      condition: condition as WeatherCondition,
      label: weatherLabels[condition as WeatherCondition],
      count,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
};

export const getAverageTemperature = (events: StageEvent[]) => {
  const temperatures = events
    .map((event) => event.temperatureC)
    .filter((value): value is number => typeof value === "number");

  if (temperatures.length === 0) {
    return null;
  }

  const total = temperatures.reduce((sum, value) => sum + value, 0);
  return Math.round((total / temperatures.length) * 10) / 10;
};
