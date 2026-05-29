import { WeatherRanking } from "../components/WeatherRanking";
import { venues } from "../data/venues";
import { sampleEvents } from "../services/eventService";

export function Statistics() {
  const attendedCount = sampleEvents.filter((event) => event.ticketStatus === "attended").length;
  const totalSpend = sampleEvents.reduce((sum, event) => sum + (event.ticketPrice ?? 0), 0);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Statistics</h1>
      </header>
      <section className="stat-grid">
        <article>
          <span>Events</span>
          <strong>{sampleEvents.length}</strong>
        </article>
        <article>
          <span>Attended</span>
          <strong>{attendedCount}</strong>
        </article>
        <article>
          <span>Venues</span>
          <strong>{venues.length}</strong>
        </article>
        <article>
          <span>Ticket spend</span>
          <strong>{totalSpend.toLocaleString()} JPY</strong>
        </article>
      </section>
      <WeatherRanking events={sampleEvents} />
    </main>
  );
}
