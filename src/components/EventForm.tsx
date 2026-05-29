import { useState } from "react";
import type { FormEvent } from "react";
import { venues } from "../data/venues";
import type { EventFormValues, StageEvent, TicketStatus } from "../types/event";

interface EventFormProps {
  onSubmit: (event: StageEvent) => void;
}

const ticketStatuses: TicketStatus[] = ["wishlist", "entered", "won", "lost", "attended"];

const initialValues: EventFormValues = {
  title: "",
  artist: "",
  venueId: venues[0]?.id ?? "",
  date: "",
  seat: "",
  ticketPrice: "",
  ticketStatus: "wishlist",
  notes: "",
};

export function EventForm({ onSubmit }: EventFormProps) {
  const [values, setValues] = useState<EventFormValues>(initialValues);

  const updateValue = (field: keyof EventFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit({
      id: crypto.randomUUID(),
      title: values.title,
      artist: values.artist,
      venueId: values.venueId,
      date: values.date,
      seat: values.seat || undefined,
      ticketPrice: values.ticketPrice ? Number(values.ticketPrice) : undefined,
      ticketStatus: values.ticketStatus,
      notes: values.notes || undefined,
    });

    setValues(initialValues);
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input
          required
          value={values.title}
          onChange={(event) => updateValue("title", event.target.value)}
        />
      </label>
      <label>
        Artist
        <input
          required
          value={values.artist}
          onChange={(event) => updateValue("artist", event.target.value)}
        />
      </label>
      <label>
        Venue
        <select value={values.venueId} onChange={(event) => updateValue("venueId", event.target.value)}>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Date
        <input
          required
          type="date"
          value={values.date}
          onChange={(event) => updateValue("date", event.target.value)}
        />
      </label>
      <label>
        Seat
        <input value={values.seat} onChange={(event) => updateValue("seat", event.target.value)} />
      </label>
      <label>
        Ticket price
        <input
          min="0"
          type="number"
          value={values.ticketPrice}
          onChange={(event) => updateValue("ticketPrice", event.target.value)}
        />
      </label>
      <label>
        Status
        <select
          value={values.ticketStatus}
          onChange={(event) => updateValue("ticketStatus", event.target.value)}
        >
          {ticketStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="event-form__wide">
        Notes
        <textarea value={values.notes} onChange={(event) => updateValue("notes", event.target.value)} />
      </label>
      <button type="submit">Add event</button>
    </form>
  );
}
