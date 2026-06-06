import { Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { groupVenuesByRegion } from "../data/venues";
import { clearDraft, getDraft, getTicketDraftKey, hasDraft, saveDraft } from "../services/draftStorage";
import type { Venue } from "../types/event";
import type { TicketApplication, TicketApplicationFormValues } from "../types/ticket";
import { platformOptions, statusOptions } from "../utils/ticketUtils";

interface TicketApplicationFormProps {
  venues: Venue[];
  editingApplication?: TicketApplication | null;
  onSave: (values: TicketApplicationFormValues) => void | Promise<void>;
  onCancel: () => void;
}

type TicketDraftPayload = TicketApplicationFormValues & {
  venueName?: string;
  city?: string;
  country?: string;
  linkedEventId?: string;
};

const createInitialValues = (
  editingApplication?: TicketApplication | null,
): TicketApplicationFormValues => ({
  eventTitle: editingApplication?.eventTitle ?? "",
  artist: editingApplication?.artist ?? "",
  venueId: editingApplication?.venueId ?? "",
  eventDate: editingApplication?.eventDate ?? "",
  platform: editingApplication?.platform ?? "eplus",
  applicationDate: editingApplication?.applicationDate ?? "",
  resultDate: editingApplication?.resultDate ?? "",
  paymentDeadline: editingApplication?.paymentDeadline ?? "",
  issueDate: editingApplication?.issueDate ?? "",
  status: editingApplication?.status ?? "planned",
  ticketType: editingApplication?.ticketType ?? "",
  price: typeof editingApplication?.price === "number" ? String(editingApplication.price) : "",
  quantity: typeof editingApplication?.quantity === "number" ? String(editingApplication.quantity) : "1",
  companionName: editingApplication?.companionName ?? "",
  companionContact: editingApplication?.companionContact ?? "",
  memo: editingApplication?.memo ?? "",
});

export function TicketApplicationForm({
  venues,
  editingApplication,
  onSave,
  onCancel,
}: TicketApplicationFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<TicketApplicationFormValues>(() =>
    createInitialValues(editingApplication),
  );
  const [error, setError] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [pendingDraft, setPendingDraft] = useState<TicketDraftPayload | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const valuesRef = useRef(values);
  const isDirtyRef = useRef(false);
  const venueGroups = useMemo(() => groupVenuesByRegion(venues), [venues]);
  const draftKey = useMemo(() => getTicketDraftKey(editingApplication?.id), [editingApplication?.id]);

  useEffect(() => {
    setValues(createInitialValues(editingApplication));
    setError("");
    setDraftStatus("");
    setIsDirty(false);
    isDirtyRef.current = false;
    setPendingDraft(getDraft<TicketDraftPayload>(getTicketDraftKey(editingApplication?.id)));
  }, [editingApplication]);

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

  const updateValue = (field: keyof TicketApplicationFormValues, value: string) => {
    setIsDirty(true);
    setValues((current) => ({ ...current, [field]: value }));
  };

  const createDraftPayload = useCallback(
    (currentValues: TicketApplicationFormValues): TicketDraftPayload => {
      const venue = venues.find((item) => item.id === currentValues.venueId);

      return {
        ...currentValues,
        venueName: venue?.name,
        city: venue?.city,
        country: venue?.country,
        linkedEventId: editingApplication?.linkedEventId,
      };
    },
    [editingApplication?.linkedEventId, venues],
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
      ...createInitialValues(editingApplication),
      ...pendingDraft,
    });
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

  const handleCancel = () => {
    if (isDirty && hasDraft(draftKey)) {
      const confirmed = window.confirm(`${t("draft.unsavedChanges")}. ${t("draft.saved")}`);

      if (!confirmed) {
        return;
      }
    }

    clearDraft(draftKey);
    onCancel();
  };

  const validate = () => {
    if (!values.eventTitle.trim() || !values.artist.trim() || !values.platform || !values.status) {
      return t("tickets.requiredError");
    }

    if (values.price && Number(values.price) < 0) {
      return t("tickets.priceError");
    }

    if (values.quantity && (!Number.isInteger(Number(values.quantity)) || Number(values.quantity) <= 0)) {
      return t("tickets.quantityError");
    }

    return "";
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    saveCurrentDraft();
    setIsDirty(false);
    isDirtyRef.current = false;
    onSave({
      ...values,
      eventTitle: values.eventTitle.trim(),
      artist: values.artist.trim(),
      ticketType: values.ticketType.trim(),
      companionName: values.companionName.trim(),
      companionContact: values.companionContact.trim(),
      memo: values.memo.trim(),
    });

    if (!editingApplication) {
      setValues(createInitialValues());
    }
  };

  return (
    <section className="form-panel ticket-application-form" aria-labelledby="ticket-form-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{editingApplication ? t("tickets.formEyebrowEdit") : t("tickets.formEyebrowNew")}</span>
          <h2 id="ticket-form-title">{editingApplication ? t("tickets.editApplication") : t("tickets.addApplication")}</h2>
        </div>
        {editingApplication ? (
          <button className="ghost-button" type="button" onClick={handleCancel}>
            <X size={16} aria-hidden="true" />
            {t("tickets.cancel")}
          </button>
        ) : null}
      </div>

      {pendingDraft ? (
        <section className="draft-banner" aria-label={t("draft.ticketDraft")}>
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
          {t("tickets.eventTitle")}
          <input required value={values.eventTitle} onChange={(event) => updateValue("eventTitle", event.target.value)} />
        </label>
        <label>
          {t("tickets.artist")}
          <input required value={values.artist} onChange={(event) => updateValue("artist", event.target.value)} />
        </label>
        <label>
          {t("tickets.venue")}
          <select value={values.venueId} onChange={(event) => updateValue("venueId", event.target.value)}>
            <option value="">{t("tickets.noVenue")}</option>
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
          {t("tickets.eventDate")}
          <input type="date" value={values.eventDate} onChange={(event) => updateValue("eventDate", event.target.value)} />
        </label>
        <label>
          {t("tickets.platform")}
          <select required value={values.platform} onChange={(event) => updateValue("platform", event.target.value)}>
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {t(`platform.${platform}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("tickets.status")}
          <select required value={values.status} onChange={(event) => updateValue("status", event.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("tickets.applicationDate")}
          <input type="date" value={values.applicationDate} onChange={(event) => updateValue("applicationDate", event.target.value)} />
        </label>
        <label>
          {t("tickets.resultDate")}
          <input type="date" value={values.resultDate} onChange={(event) => updateValue("resultDate", event.target.value)} />
        </label>
        <label>
          {t("tickets.paymentDeadline")}
          <input type="date" value={values.paymentDeadline} onChange={(event) => updateValue("paymentDeadline", event.target.value)} />
        </label>
        <label>
          {t("tickets.issueDate")}
          <input type="date" value={values.issueDate} onChange={(event) => updateValue("issueDate", event.target.value)} />
        </label>
        <label>
          {t("tickets.ticketType")}
          <input value={values.ticketType} onChange={(event) => updateValue("ticketType", event.target.value)} />
        </label>
        <label>
          {t("tickets.price")}
          <input min="0" type="number" value={values.price} onChange={(event) => updateValue("price", event.target.value)} />
        </label>
        <label>
          {t("tickets.quantity")}
          <input min="1" step="1" type="number" value={values.quantity} onChange={(event) => updateValue("quantity", event.target.value)} />
        </label>
        <label>
          {t("tickets.companionName")}
          <input value={values.companionName} onChange={(event) => updateValue("companionName", event.target.value)} />
        </label>
        <label>
          {t("tickets.companionContact")}
          <input value={values.companionContact} onChange={(event) => updateValue("companionContact", event.target.value)} />
        </label>
        <div className="venue-readout">
          <span>{t("eventForm.venueDetails")}</span>
          <strong>
            {selectedVenue
              ? `${selectedVenue.city}, ${selectedVenue.prefecture ?? selectedVenue.country} · ${
                  selectedVenue.category ? t(`venues.categories.${selectedVenue.category}`) : t("venues.categories.other")
                }`
              : t("common.optional")}
          </strong>
        </div>
        <label className="event-form__wide">
          {t("tickets.memo")}
          <textarea rows={4} value={values.memo} onChange={(event) => updateValue("memo", event.target.value)} />
        </label>
        {error ? <p className="form-error event-form__wide">{error}</p> : null}
        <button className="primary-button event-form__submit" type="submit">
          <Save size={18} aria-hidden="true" />
          {t("tickets.save")}
        </button>
      </form>
    </section>
  );
}
