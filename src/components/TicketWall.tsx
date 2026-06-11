import { TicketWallCard } from "./TicketWallCard";
import type { EventRecord } from "../types/event";

interface TicketWallProps {
  events: EventRecord[];
  onEdit: (event: EventRecord) => void;
}

export function TicketWall({ events, onEdit }: TicketWallProps) {
  return (
    <section className="ticket-wall-grid" aria-label="Ticket Wall">
      {events.map((event) => (
        <TicketWallCard event={event} key={event.id} onEdit={onEdit} />
      ))}
    </section>
  );
}
