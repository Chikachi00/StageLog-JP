import { getVenueById } from "../data/venues";
import type { StageEvent } from "../types/event";

interface TicketCardProps {
  event: StageEvent;
}

const statusLabels: Record<StageEvent["ticketStatus"], string> = {
  wishlist: "Wishlist",
  entered: "Entered",
  won: "Won",
  lost: "Lost",
  attended: "Attended",
};

export function TicketCard({ event }: TicketCardProps) {
  const venue = getVenueById(event.venueId);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(event.date));

  return (
    <article className="ticket-card">
      <div>
        <p className="ticket-card__date">{formattedDate}</p>
        <h3>{event.title}</h3>
        <p>{event.artist}</p>
      </div>
      <dl>
        <div>
          <dt>Venue</dt>
          <dd>{venue?.name ?? "Unknown venue"}</dd>
        </div>
        {event.seat ? (
          <div>
            <dt>Seat</dt>
            <dd>{event.seat}</dd>
          </div>
        ) : null}
        {event.ticketPrice ? (
          <div>
            <dt>Ticket</dt>
            <dd>{event.ticketPrice.toLocaleString()} JPY</dd>
          </div>
        ) : null}
      </dl>
      <span className={`ticket-card__status ticket-card__status--${event.ticketStatus}`}>
        {statusLabels[event.ticketStatus]}
      </span>
    </article>
  );
}
