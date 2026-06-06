import { Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { groupVenuesByRegion } from "../data/venues";
import { clearDraft, getDraft, getEventDraftKey, hasDraft, saveDraft } from "../services/draftStorage";
import { CLOUD_IMAGE_MAX_SIZE_BYTES, CLOUD_IMAGE_MIME_TYPES } from "../services/storageService";
import type { EventFormValues, EventRecord, SeatInfo, Venue } from "../types/event";
import { SeatPicker } from "./SeatPicker";

interface EventFormProps {
  venues: Venue[];
  editingEvent?: EventRecord | null;
  useCloudImages?: boolean;
  isSaving?: boolean;
  onSave: (values: EventFormValues) => void | Promise<void>;
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

type EventDraftPayload = EventFormValues & {
  venueName?: string;
  city?: string;
  country?: string;
  imageFileName?: string;
};

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
      imagePath: editingEvent.imagePath,
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
    imagePath: undefined,
    notes: "",
  };
};

export function EventForm({
  venues,
  editingEvent,
  useCloudImages = false,
  isSaving = false,
  onSave,
  onCancelEditing,
}: EventFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<EventFormValues>(() => createInitialValues(venues, editingEvent));
  const [imageError, setImageError] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [pendingDraft, setPendingDraft] = useState<EventDraftPayload | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const valuesRef = useRef(values);
  const isDirtyRef = useRef(false);
  const venueGroups = useMemo(() => groupVenuesByRegion(venues), [venues]);
  const draftKey = useMemo(() => getEventDraftKey(editingEvent?.id), [editingEvent?.id]);

  useEffect(() => {
    setValues(createInitialValues(venues, editingEvent));
    setImageError("");
    setDraftStatus("");
    setIsDirty(false);
    isDirtyRef.current = false;
    setPendingDraft(getDraft<EventDraftPayload>(getEventDraftKey(editingEvent?.id)));
  }, [editingEvent, venues]);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === values.venueId),
    [venues, values.venueId],
  );

  const updateValue = (field: keyof Omit<EventFormValues, "seat">, value: string) => {
    setIsDirty(true);
    setValues((current) => ({ ...current, [field]: value }));
  };

  const updateSeat = (field: keyof SeatInfo, value: string) => {
    setIsDirty(true);
    setValues((current) => ({
      ...current,
      seat: {
        ...current.seat,
        [field]: value,
      },
    }));
  };

  const updateSeatInfo = (seat: SeatInfo) => {
    setIsDirty(true);
    setValues((current) => ({
      ...current,
      seat,
    }));
  };

  const createDraftPayload = useCallback(
    (currentValues: EventFormValues): EventDraftPayload => {
      const venue = venues.find((item) => item.id === currentValues.venueId);
      const imageUrl =
        currentValues.imageUrl && !currentValues.imageUrl.startsWith("blob:")
          ? currentValues.imageUrl
          : undefined;

      return {
        ...currentValues,
        imageUrl,
        imageFile: undefined,
        imageFileName: currentValues.imageFile?.name,
        venueName: venue?.name,
        city: venue?.city,
        country: venue?.country,
      };
    },
    [venues],
  );

  const saveCurrentDraft = useCallback(() => {
    if (!isDirtyRef.current) {
      return;
    }

    saveDraft(draftKey, createDraftPayload(valuesRef.current));
    setDraftStatus(t("draft.saved"));
  }, [createDraftPayload, draftKey, t]);

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      saveCurrentDraft();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [isDirty, saveCurrentDraft, values]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveCurrentDraft();
      }
    };

    const handlePageHide = () => {
      saveCurrentDraft();
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) {
        return;
      }

      saveCurrentDraft();
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveCurrentDraft]);

  useEffect(
    () => () => {
      saveCurrentDraft();
    },
    [saveCurrentDraft],
  );

  const restoreDraft = () => {
    if (!pendingDraft) {
      return;
    }

    setValues({
      ...createInitialValues(venues, editingEvent),
      ...pendingDraft,
      imageFile: undefined,
      seat: { ...emptySeat, ...(pendingDraft.seat ?? {}) },
    });
    setImageError(pendingDraft.imageFileName ? t("draft.imageReload") : "");
    setPendingDraft(null);
    setIsDirty(true);
    isDirtyRef.current = true;
    setDraftStatus(t("draft.restored"));
  };

  const discardDraft = () => {
    clearDraft(draftKey);
    setPendingDraft(null);
    setDraftStatus(t("draft.discarded"));
    setIsDirty(false);
    isDirtyRef.current = false;
  };

  const handleCancelEditing = () => {
    if (isDirty && hasDraft(draftKey)) {
      const confirmed = window.confirm(`${t("draft.unsavedChanges")}. ${t("draft.saved")}`);

      if (!confirmed) {
        return;
      }
    }

    clearDraft(draftKey);
    onCancelEditing();
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageError("");

    if (!file) {
      return;
    }

    const maxSize = useCloudImages ? CLOUD_IMAGE_MAX_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

    if (!file.type.startsWith("image/") || (useCloudImages && !CLOUD_IMAGE_MIME_TYPES.includes(file.type))) {
      setImageError(t("storage.onlyImages"));
      event.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      setImageError(t("storage.imageTooLarge"));
      event.target.value = "";
      return;
    }

    if (useCloudImages) {
      updateValue("imageUrl", URL.createObjectURL(file));
      setValues((current) => ({ ...current, imageFile: file, removeImage: false }));
      setImageError(t("draft.imageReload"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateValue("imageUrl", reader.result);
        setValues((current) => ({ ...current, imageFile: undefined, removeImage: false }));
      }
    };

    reader.onerror = () => {
      setImageError(t("eventForm.imageReadError"));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveCurrentDraft();
    setIsDirty(false);
    isDirtyRef.current = false;
    void onSave({
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
  };

  return (
    <section className="form-panel" aria-labelledby="event-form-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{editingEvent ? t("eventForm.editing") : t("eventForm.newRecord")}</span>
          <h2 id="event-form-title">{editingEvent ? t("eventForm.edit") : t("eventForm.add")}</h2>
        </div>
        {editingEvent ? (
          <button className="ghost-button" type="button" onClick={handleCancelEditing}>
            <X size={16} aria-hidden="true" />
            {t("eventForm.cancelEditing")}
          </button>
        ) : null}
      </div>

      {pendingDraft ? (
        <section className="draft-banner" aria-label={t("draft.eventDraft")}>
          <strong>{t("draft.found")}</strong>
          <div>
            <button className="ghost-button" type="button" onClick={restoreDraft}>
              {t("draft.restore")}
            </button>
            <button className="ghost-button" type="button" onClick={discardDraft}>
              {t("draft.discard")}
            </button>
          </div>
        </section>
      ) : null}
      {draftStatus ? <p className="draft-status">{draftStatus}</p> : null}

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
                onClick={() => {
                  setIsDirty(true);
                  setValues((current) => ({
                    ...current,
                    imageUrl: "",
                    imagePath: undefined,
                    imageFile: undefined,
                    removeImage: true,
                  }));
                }}
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

        <button className="primary-button event-form__submit" type="submit" disabled={isSaving}>
          <Save size={18} aria-hidden="true" />
          {isSaving ? t("common.saving") : editingEvent ? t("eventForm.update") : t("eventForm.save")}
        </button>
      </form>
    </section>
  );
}
