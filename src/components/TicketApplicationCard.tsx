import { Calendar, Pencil, PlusCircle, Trash2 } from "lucide-react";
import type { TicketApplication } from "../types/ticket";
import { formatDate } from "../utils/dateUtils";
import {
  canCreateEventRecord,
  formatTicketPrice,
  isPaymentOverdue,
  platformLabels,
  statusLabels,
} from "../utils/ticketUtils";

interface TicketApplicationCardProps {
  application: TicketApplication;
  onEdit: (application: TicketApplication) => void;
  onDelete: (id: string) => void;
  onCreateEventRecord: (application: TicketApplication) => void;
}

const dateLine = (label: string, value?: string) => (value ? `${label}: ${formatDate(value)}` : `${label}: -`);

export function TicketApplicationCard({
  application,
  onEdit,
  onDelete,
  onCreateEventRecord,
}: TicketApplicationCardProps) {
  const memoPreview =
    application.memo && application.memo.length > 100
      ? `${application.memo.slice(0, 100).trim()}...`
      : application.memo;
  const paymentPending = application.status === "won";
  const ticketNotIssued = application.status === "paid";
  const overdue = isPaymentOverdue(application);

  return (
    <article className="ticket-application-card">
      <div className="ticket-application-card__header">
        <div>
          <span className={`status-badge status-badge--${application.status}`}>
            {statusLabels[application.status]}
          </span>
          <h3>{application.eventTitle}</h3>
          <p>{application.artist}</p>
        </div>
        <strong>{platformLabels[application.platform]}</strong>
      </div>

      <dl className="ticket-application-card__details">
        <div>
          <dt>Venue</dt>
          <dd>{application.venueName || "No venue selected"}</dd>
        </div>
        <div>
          <dt>Event date</dt>
          <dd>{application.eventDate ? formatDate(application.eventDate) : "-"}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>{formatTicketPrice(application)}</dd>
        </div>
        <div>
          <dt>Quantity</dt>
          <dd>{application.quantity ?? 1}</dd>
        </div>
        <div>
          <dt>Companion</dt>
          <dd>{application.companionName || "Solo / No companion"}</dd>
        </div>
      </dl>

      <div className="important-dates">
        <Calendar size={16} aria-hidden="true" />
        <span>{dateLine("Apply", application.applicationDate)}</span>
        <span>{dateLine("Result", application.resultDate)}</span>
        <span>{dateLine("Pay", application.paymentDeadline)}</span>
        <span>{dateLine("Issue", application.issueDate)}</span>
      </div>

      {paymentPending ? <p className="ticket-warning">Payment pending</p> : null}
      {ticketNotIssued ? <p className="ticket-warning">Ticket not issued yet</p> : null}
      {overdue ? <p className="ticket-warning ticket-warning--overdue">Payment deadline is overdue</p> : null}
      {memoPreview ? <p className="ticket-application-card__memo">{memoPreview}</p> : null}

      <div className="ticket-application-card__actions">
        <button className="icon-button" type="button" onClick={() => onEdit(application)}>
          <Pencil size={16} aria-hidden="true" />
          Edit
        </button>
        <button className="icon-button" type="button" onClick={() => onDelete(application.id)}>
          <Trash2 size={16} aria-hidden="true" />
          Delete
        </button>
        {application.linkedEventId ? (
          <span className="linked-event-badge">Event record already created</span>
        ) : canCreateEventRecord(application) ? (
          <button className="icon-button icon-button--weather" type="button" onClick={() => onCreateEventRecord(application)}>
            <PlusCircle size={16} aria-hidden="true" />
            Create Event Record
          </button>
        ) : null}
      </div>
    </article>
  );
}
