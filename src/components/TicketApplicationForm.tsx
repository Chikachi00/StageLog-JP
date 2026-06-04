import { Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Venue } from "../types/event";
import type { TicketApplication, TicketApplicationFormValues } from "../types/ticket";
import { platformOptions, statusOptions } from "../utils/ticketUtils";

interface TicketApplicationFormProps {
  venues: Venue[];
  editingApplication?: TicketApplication | null;
  onSave: (values: TicketApplicationFormValues) => void;
  onCancel: () => void;
}

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

  useEffect(() => {
    setValues(createInitialValues(editingApplication));
    setError("");
  }, [editingApplication]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === values.venueId),
    [venues, values.venueId],
  );

  const updateValue = (field: keyof TicketApplicationFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
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
          <button className="ghost-button" type="button" onClick={onCancel}>
            <X size={16} aria-hidden="true" />
            {t("tickets.cancel")}
          </button>
        ) : null}
      </div>

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
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
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
          <strong>{selectedVenue ? `${selectedVenue.city}, ${selectedVenue.country}` : t("common.optional")}</strong>
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
