import { Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { clearDraft, getDraft, getEventDraftKey, hasDraft, saveDraft } from "../services/draftStorage";
import { CLOUD_IMAGE_MAX_SIZE_BYTES, CLOUD_IMAGE_MIME_TYPES } from "../services/storageService";
import type { EventFormValues, EventRecord, SeatInfo, Venue } from "../types/event";
import type { VenueValue } from "../utils/venueSearchUtils";
import { SeatPicker } from "./SeatPicker";
import { VenueCombobox } from "./VenueCombobox";

interface EventFormProps {
  venues: Venue[];
  events?: EventRecord[];
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
  imageFileName?: string;
};

const createInitialValues = (venues: Venue[], editingEvent?: EventRecord | null): EventFormValues => {
  const defaultVenue = venues[0];

  if (editingEvent) {
    return {
      title: editingEvent.title,
      artist: editingEvent.artist,
      date: editingEvent.date,
      startTime: editingEvent.startTime,
      venueId: editingEvent.venueId,
      venueName: editingEvent.venueName,
      city: editingEvent.city,
      country: editingEvent.country,
      prefecture: editingEvent.prefecture,
      region: editingEvent.region,
      latitude: editingEvent.latitude,
      longitude: editingEvent.longitude,
      isCustomVenue: editingEvent.isCustomVenue ?? editingEvent.venueId.startsWith("custom:"),
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
    venueId: defaultVenue?.id ?? "",
    venueName: defaultVenue?.name ?? "",
    city: defaultVenue?.city ?? "",
    country: defaultVenue?.country ?? "Japan",
    prefecture: defaultVenue?.prefecture,
    region: defaultVenue?.region,
    latitude: defaultVenue?.latitude,
    longitude: defaultVenue?.longitude,
    isCustomVenue: false,
    ticketType: "",
    seat: emptySeat,
    imageUrl: undefined,
    imagePath: undefined,
    notes: "",
  };
};

export function EventForm({
  venues,
  events = [],
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
  const [hasAutoRestoredDraft, setHasAutoRestoredDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const valuesRef = useRef(values);
  const isDirtyRef = useRef(false);
  const draftKey = useMemo(() => getEventDraftKey(editingEvent?.id), [editingEvent?.id]);

  useEffect(() => {
    const initialValues = createInitialValues(venues, editingEvent);
    const draft = getDraft<EventDraftPayload>(getEventDraftKey(editingEvent?.id));

    if (draft) {
      setValues({
        ...initialValues,
        ...draft,
        imageFile: undefined,
        seat: { ...emptySeat, ...(draft.seat ?? {}) },
      });
      setImageError(draft.imageFileName ? t("draft.imageReload") : "");
      setDraftStatus(t("draft.autoRestored"));
      setHasAutoRestoredDraft(true);
      setIsDirty(true);
      isDirtyRef.current = true;
      return;
    }

    setValues(initialValues);
    setImageError("");
    setDraftStatus("");
    setHasAutoRestoredDraft(false);
    setIsDirty(false);
    isDirtyRef.current = false;
  }, [editingEvent, t, venues]);

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

  const updateVenue = (venue: VenueValue) => {
    setIsDirty(true);
    setValues((current) => ({
      ...current,
      venueId: venue.venueId ?? "",
      venueName: venue.venueName ?? "",
      city: venue.city ?? "",
      country: venue.country ?? "Japan",
      prefecture: venue.prefecture,
      region: venue.region,
      latitude: venue.latitude,
      longitude: venue.longitude,
      isCustomVenue: venue.isCustomVenue ?? false,
      seat: venue.isCustomVenue
        ? {
            gate: current.seat.gate,
            level: current.seat.level,
            block: current.seat.block,
            row: current.seat.row,
            number: current.seat.number,
          }
        : current.seat,
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
        venueName: currentValues.venueName || venue?.name || "",
        city: currentValues.city || venue?.city || "",
        country: currentValues.country || venue?.country || "Japan",
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

  const discardDraft = () => {
    clearDraft(draftKey);
    setValues(createInitialValues(venues, editingEvent));
    setImageError("");
    setDraftStatus(t("draft.discarded"));
    setHasAutoRestoredDraft(false);
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

      {hasAutoRestoredDraft ? (
        <section className="draft-banner" aria-label={t("draft.eventDraft")}>
          <strong>{draftStatus}</strong>
          <div>
            <button className="ghost-button" type="button" onClick={discardDraft}>
              {t("draft.discard")}
            </button>
          </div>
        </section>
      ) : draftStatus ? (
        <p className="draft-status">{draftStatus}</p>
      ) : null}

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

        <VenueCombobox
          events={events}
          label={t("eventForm.venue")}
          value={values}
          venues={venues}
          onChange={updateVenue}
        />

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
              : values.venueName
                ? `${values.city || "Unknown"}, ${values.country || "Japan"} / ${t("venueSearch.customVenue")}`
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

        {selectedVenue?.supportedSeatMap ? (
          <SeatPicker venue={selectedVenue} seat={values.seat} onChange={updateSeatInfo} />
        ) : selectedVenue || values.venueName ? (
          <p className="draft-status event-form__wide">{t("venueSearch.seatMapBuiltInOnly")}</p>
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
