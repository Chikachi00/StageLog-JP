import { TicketCard } from "../components/TicketCard";
import { sampleEvents } from "../services/eventService";

export function Home() {
  const nextEvent = [...sampleEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )[0];

  return (
    <main className="page">
      <section className="page-hero">
        <div>
          <p>StageLog JP</p>
          <h1>Track concerts, tickets, venues, and weather in one place.</h1>
        </div>
      </section>
      {nextEvent ? (
        <section>
          <h2>Next event</h2>
          <TicketCard event={nextEvent} />
        </section>
      ) : null}
    </main>
  );
}
