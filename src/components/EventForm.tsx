import { Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { groupVenuesByRegion } from "../data/venues";
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
      seat: { ...emptySeat, ...(editingEvent.seat ?? {}) },
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
  const { t } = useTranslation();
  const [values, setValues] = useState<EventFormValues>(() => createInitialValues(venues, editingEvent));
  const [imageError, setImageError] = useState("");
  const venueGroups = useMemo(() => groupVenuesByRegion(venues), [venues]);

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
      setImageError(t("eventForm.imageTooLarge"));
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
      setImageError(t("eventForm.imageReadError"));
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
        sectionId: values.seat.sectionId,
        sectionLabel: values.seat.sectionLabel,
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
          <span className="eyebrow">{editingEvent ? t("eventForm.editing") : t("eventForm.newRecord")}</span>
          <h2 id="event-form-title">{editingEvent ? t("eventForm.edit") : t("eventForm.add")}</h2>
        </div>
        {editingEvent ? (
          <button className="ghost-button" type="button" onClick={onCancelEditing}>
            <X size={16} aria-hidden="true" />
            {t("eventForm.cancelEditing")}
          </button>
        ) : null}
      </div>

      <form className="event-form" onSubmit={handleSubmit}>
        <label>
          {t("eventForm.title")}
          <input
            required
            value={values.title}
            onChange={(event) => updateValue("title", event.target.value)}
            placeholder={t("eventForm.titlePlaceholder")}
          />
        </label>

        <label>
          {t("eventForm.artist")}
          <input
            required
            value={values.artist}
            onChange={(event) => updateValue("artist", event.target.value)}
            placeholder={t("eventForm.artistPlaceholder")}
          />
        </label>

        <label>
          {t("eventForm.date")}
          <input
            required
            type="date"
            value={values.date}
            onChange={(event) => updateValue("date", event.target.value)}
          />
        </label>

        <label>
          {t("eventForm.startTime")}
          <input
            type="time"
            value={values.startTime}
            onChange={(event) => updateValue("startTime", event.target.value)}
          />
        </label>

        <label>
          {t("eventForm.venue")}
          <select
            required
            value={values.venueId}
            onChange={(event) => updateValue("venueId", event.target.value)}
          >
            {venueGroups.map((group) => (
              <optgroup key={group.region} label={group.region}>
                {group.venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.nameJa && venue.nameJa !== venue.name ? `${venue.name} / ${venue.nameJa}` : venue.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label>
          {t("eventForm.ticketType")}
          <input
            value={values.ticketType}
            onChange={(event) => updateValue("ticketType", event.target.value)}
            placeholder={t("eventForm.ticketTypePlaceholder")}
          />
        </label>

        <div className="venue-readout">
          <span>{t("eventForm.venueDetails")}</span>
          <strong>
            {selectedVenue
              ? `${selectedVenue.city}, ${selectedVenue.prefecture ?? selectedVenue.country} · ${
                  selectedVenue.category ? t(`venues.categories.${selectedVenue.category}`) : t("venues.categories.other")
                }`
              : t("eventForm.selectVenue")}
          </strong>
        </div>

        <fieldset className="seat-fieldset">
          <legend>{t("eventForm.seatInfo")}</legend>
          <label>
            {t("eventForm.gate")}
            <input value={values.seat.gate} onChange={(event) => updateSeat("gate", event.target.value)} />
          </label>
          <label>
            {t("eventForm.level")}
            <input value={values.seat.level} onChange={(event) => updateSeat("level", event.target.value)} />
          </label>
          <label>
            {t("eventForm.block")}
            <input value={values.seat.block} onChange={(event) => updateSeat("block", event.target.value)} />
          </label>
          <label>
            {t("eventForm.row")}
            <input value={values.seat.row} onChange={(event) => updateSeat("row", event.target.value)} />
          </label>
          <label>
            {t("eventForm.seatNumber")}
            <input value={values.seat.number} onChange={(event) => updateSeat("number", event.target.value)} />
          </label>
        </fieldset>

        {selectedVenue ? (
          <SeatPicker venue={selectedVenue} seat={values.seat} onChange={updateSeatInfo} />
        ) : null}

        <div className="image-upload">
          <label>
            {t("eventForm.image")}
            <input accept="image/*" type="file" onChange={handleImageChange} />
          </label>
          {imageError ? <p className="form-error">{imageError}</p> : null}
          {values.imageUrl ? (
            <div className="image-preview-row">
              <img src={values.imageUrl} alt={t("eventForm.imagePreviewAlt")} />
              <button
                className="ghost-button"
                type="button"
                onClick={() => updateValue("imageUrl", "")}
              >
                <X size={16} aria-hidden="true" />
                {t("eventForm.removeImage")}
              </button>
            </div>
          ) : null}
        </div>

        <label className="event-form__wide">
          {t("eventForm.notes")}
          <textarea
            rows={5}
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
            placeholder={t("eventForm.notesPlaceholder")}
          />
        </label>

        <button className="primary-button event-form__submit" type="submit">
          <Save size={18} aria-hidden="true" />
          {editingEvent ? t("eventForm.update") : t("eventForm.save")}
        </button>
      </form>
    </section>
  );
}
