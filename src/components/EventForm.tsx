import { Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { EventFormValues, EventRecord, SeatInfo, Venue } from "../types/event";
import { SeatPicker } from "./SeatPicker";

interface EventFormProps {
  venues: Venue[];
  editingEvent?: EventRecord | null;
  onSave: (values: EventFormValues) => void;
  onCancelEditing: () => void;
}

const emptySeat: SeatInfo = {
  gate: "",
  level: "",
  block: "",
  row: "",
  number: "",
};

const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024;

const createInitialValues = (venues: Venue[], editingEvent?: EventRecord | null): EventFormValues => {
  if (editingEvent) {
    return {
      title: editingEvent.title,
      artist: editingEvent.artist,
      date: editingEvent.date,
      startTime: editingEvent.startTime,
      venueId: editingEvent.venueId,
      ticketType: editingEvent.ticketType,
      seat: editingEvent.seat,
      imageUrl: editingEvent.imageUrl,
      notes: editingEvent.notes,
    };
  }

  return {
    title: "",
    artist: "",
    date: "",
    startTime: "",
    venueId: venues[0]?.id ?? "",
    ticketType: "",
    seat: emptySeat,
    imageUrl: undefined,
    notes: "",
  };
};

export function EventForm({ venues, editingEvent, onSave, onCancelEditing }: EventFormProps) {
  const [values, setValues] = useState<EventFormValues>(() => createInitialValues(venues, editingEvent));
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    setValues(createInitialValues(venues, editingEvent));
    setImageError("");
  }, [editingEvent, venues]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === values.venueId),
    [venues, values.venueId],
  );

  const updateValue = (field: keyof Omit<EventFormValues, "seat">, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const updateSeat = (field: keyof SeatInfo, value: string) => {
    setValues((current) => ({
      ...current,
      seat: {
        ...current.seat,
        [field]: value,
      },
    }));
  };

  const updateSeatInfo = (seat: SeatInfo) => {
    setValues((current) => ({
      ...current,
      seat,
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageError("");

    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError("Image is too large. Please choose an image under 1.5MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateValue("imageUrl", reader.result);
      }
    };

    reader.onerror = () => {
      setImageError("Unable to read this image. Please choose another file.");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      ...values,
      title: values.title.trim(),
      artist: values.artist.trim(),
      ticketType: values.ticketType.trim(),
      notes: values.notes.trim(),
      seat: {
        gate: values.seat.gate?.trim() ?? "",
        level: values.seat.level?.trim() ?? "",
        block: values.seat.block?.trim() ?? "",
        row: values.seat.row?.trim() ?? "",
        number: values.seat.number?.trim() ?? "",
        x: values.seat.x,
        y: values.seat.y,
      },
    });

    if (!editingEvent) {
      setValues(createInitialValues(venues));
    }
  };

  return (
    <section className="form-panel" aria-labelledby="event-form-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{editingEvent ? "Editing" : "New record"}</span>
          <h2 id="event-form-title">{editingEvent ? "Edit Event" : "Add Event"}</h2>
        </div>
        {editingEvent ? (
          <button className="ghost-button" type="button" onClick={onCancelEditing}>
            <X size={16} aria-hidden="true" />
            Cancel editing
          </button>
        ) : null}
      </div>

      <form className="event-form" onSubmit={handleSubmit}>
        <label>
          Event title
          <input
            required
            value={values.title}
            onChange={(event) => updateValue("title", event.target.value)}
            placeholder="Final live, anniversary tour, fan meeting..."
          />
        </label>

        <label>
          Artist / performer
          <input
            required
            value={values.artist}
            onChange={(event) => updateValue("artist", event.target.value)}
            placeholder="Artist, unit, orchestra, cast..."
          />
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
          Start time
          <input
            type="time"
            value={values.startTime}
            onChange={(event) => updateValue("startTime", event.target.value)}
          />
        </label>

        <label>
          Venue
          <select
            required
            value={values.venueId}
            onChange={(event) => updateValue("venueId", event.target.value)}
          >
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ticket type
          <input
            value={values.ticketType}
            onChange={(event) => updateValue("ticketType", event.target.value)}
            placeholder="FC advance, reserved seat, general..."
          />
        </label>

        <div className="venue-readout">
          <span>Venue details</span>
          <strong>{selectedVenue ? `${selectedVenue.city}, ${selectedVenue.country}` : "Select a venue"}</strong>
        </div>

        <fieldset className="seat-fieldset">
          <legend>Seat information</legend>
          <label>
            Gate
            <input value={values.seat.gate} onChange={(event) => updateSeat("gate", event.target.value)} />
          </label>
          <label>
            Level
            <input value={values.seat.level} onChange={(event) => updateSeat("level", event.target.value)} />
          </label>
          <label>
            Block
            <input value={values.seat.block} onChange={(event) => updateSeat("block", event.target.value)} />
          </label>
          <label>
            Row
            <input value={values.seat.row} onChange={(event) => updateSeat("row", event.target.value)} />
          </label>
          <label>
            Seat number
            <input value={values.seat.number} onChange={(event) => updateSeat("number", event.target.value)} />
          </label>
        </fieldset>

        {selectedVenue ? (
          <SeatPicker venue={selectedVenue} seat={values.seat} onChange={updateSeatInfo} />
        ) : null}

        <div className="image-upload">
          <label>
            Event image / cover image
            <input accept="image/*" type="file" onChange={handleImageChange} />
          </label>
          {imageError ? <p className="form-error">{imageError}</p> : null}
          {values.imageUrl ? (
            <div className="image-preview-row">
              <img src={values.imageUrl} alt="Event cover preview" />
              <button
                className="ghost-button"
                type="button"
                onClick={() => updateValue("imageUrl", "")}
              >
                <X size={16} aria-hidden="true" />
                Remove image
              </button>
            </div>
          ) : null}
        </div>

        <label className="event-form__wide">
          Notes
          <textarea
            rows={5}
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
            placeholder="Memories, setlist notes, merch, travel, friends..."
          />
        </label>

        <button className="primary-button event-form__submit" type="submit">
          <Save size={18} aria-hidden="true" />
          Save event
        </button>
      </form>
    </section>
  );
}
