import { getAverageTemperature, rankWeatherConditions } from "../services/weatherService";
import type { StageEvent } from "../types/event";

interface WeatherRankingProps {
  events: StageEvent[];
}

export function WeatherRanking({ events }: WeatherRankingProps) {
  const ranking = rankWeatherConditions(events);
  const averageTemperature = getAverageTemperature(events);

  return (
    <section className="weather-ranking">
      <div>
        <h2>Weather ranking</h2>
        <p>{averageTemperature === null ? "No temperature data" : `${averageTemperature} C average`}</p>
      </div>
      {ranking.length > 0 ? (
        <ol>
          {ranking.map((item) => (
            <li key={item.condition}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p>No weather records yet.</p>
      )}
    </section>
  );
}
