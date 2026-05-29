import { useMemo, useState } from "react";
import { EventForm } from "../components/EventForm";
import { TicketCard } from "../components/TicketCard";
import { YearFilter } from "../components/YearFilter";
import { filterEventsByYear, getEventYears, sampleEvents } from "../services/eventService";
import type { StageEvent } from "../types/event";

export function Events() {
  const [events, setEvents] = useState<StageEvent[]>(sampleEvents);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const years = useMemo(() => getEventYears(events), [events]);
  const filteredEvents = useMemo(
    () => filterEventsByYear(events, selectedYear),
    [events, selectedYear],
  );

  return (
    <main className="page">
      <header className="page-header">
        <h1>Events</h1>
        <YearFilter years={years} selectedYear={selectedYear} onChange={setSelectedYear} />
      </header>
      <EventForm onSubmit={(event) => setEvents((current) => [event, ...current])} />
      <section className="ticket-grid">
        {filteredEvents.map((event) => (
          <TicketCard event={event} key={event.id} />
        ))}
      </section>
    </main>
  );
}
