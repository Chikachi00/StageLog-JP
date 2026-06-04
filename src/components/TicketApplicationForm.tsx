import { Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Venue } from "../types/event";
import type { TicketApplication, TicketApplicationFormValues } from "../types/ticket";
import { platformLabels, platformOptions, statusLabels, statusOptions } from "../utils/ticketUtils";

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
      return "Event title, artist, platform, and status are required.";
    }

    if (values.price && Number(values.price) < 0) {
      return "Price must be a non-negative number.";
    }

    if (values.quantity && (!Number.isInteger(Number(values.quantity)) || Number(values.quantity) <= 0)) {
      return "Quantity must be a positive integer.";
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
          <span className="eyebrow">{editingApplication ? "Editing lottery" : "Ticket lottery"}</span>
          <h2 id="ticket-form-title">{editingApplication ? "Edit Application" : "Add Application"}</h2>
        </div>
        {editingApplication ? (
          <button className="ghost-button" type="button" onClick={onCancel}>
            <X size={16} aria-hidden="true" />
            Cancel
          </button>
        ) : null}
      </div>

      <form className="event-form" onSubmit={handleSubmit}>
        <label>
          Event title
          <input required value={values.eventTitle} onChange={(event) => updateValue("eventTitle", event.target.value)} />
        </label>
        <label>
          Artist
          <input required value={values.artist} onChange={(event) => updateValue("artist", event.target.value)} />
        </label>
        <label>
          Venue
          <select value={values.venueId} onChange={(event) => updateValue("venueId", event.target.value)}>
            <option value="">No venue selected</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Event date
          <input type="date" value={values.eventDate} onChange={(event) => updateValue("eventDate", event.target.value)} />
        </label>
        <label>
          Platform
          <select required value={values.platform} onChange={(event) => updateValue("platform", event.target.value)}>
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {platformLabels[platform]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select required value={values.status} onChange={(event) => updateValue("status", event.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Application date
          <input type="date" value={values.applicationDate} onChange={(event) => updateValue("applicationDate", event.target.value)} />
        </label>
        <label>
          Result date
          <input type="date" value={values.resultDate} onChange={(event) => updateValue("resultDate", event.target.value)} />
        </label>
        <label>
          Payment deadline
          <input type="date" value={values.paymentDeadline} onChange={(event) => updateValue("paymentDeadline", event.target.value)} />
        </label>
        <label>
          Issue date
          <input type="date" value={values.issueDate} onChange={(event) => updateValue("issueDate", event.target.value)} />
        </label>
        <label>
          Ticket type
          <input value={values.ticketType} onChange={(event) => updateValue("ticketType", event.target.value)} />
        </label>
        <label>
          Price
          <input min="0" type="number" value={values.price} onChange={(event) => updateValue("price", event.target.value)} />
        </label>
        <label>
          Quantity
          <input min="1" step="1" type="number" value={values.quantity} onChange={(event) => updateValue("quantity", event.target.value)} />
        </label>
        <label>
          Companion name
          <input value={values.companionName} onChange={(event) => updateValue("companionName", event.target.value)} />
        </label>
        <label>
          Companion contact
          <input value={values.companionContact} onChange={(event) => updateValue("companionContact", event.target.value)} />
        </label>
        <div className="venue-readout">
          <span>Venue details</span>
          <strong>{selectedVenue ? `${selectedVenue.city}, ${selectedVenue.country}` : "Optional"}</strong>
        </div>
        <label className="event-form__wide">
          Memo
          <textarea rows={4} value={values.memo} onChange={(event) => updateValue("memo", event.target.value)} />
        </label>
        {error ? <p className="form-error event-form__wide">{error}</p> : null}
        <button className="primary-button event-form__submit" type="submit">
          <Save size={18} aria-hidden="true" />
          Save application
        </button>
      </form>
    </section>
  );
}
