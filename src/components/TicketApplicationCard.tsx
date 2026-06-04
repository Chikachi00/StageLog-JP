import { Calendar, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TicketApplication } from "../types/ticket";
import { formatDate } from "../utils/dateUtils";
import {
  canCreateEventRecord,
  isPaymentOverdue,
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
  const { t } = useTranslation();
  const memoPreview =
    application.memo && application.memo.length > 100
      ? `${application.memo.slice(0, 100).trim()}...`
      : application.memo;
  const paymentPending = application.status === "won";
  const ticketNotIssued = application.status === "paid";
  const overdue = isPaymentOverdue(application);

  const priceLabel =
    typeof application.price === "number"
      ? `${((application.price ?? 0) * (application.quantity ?? 1)).toLocaleString()} JPY`
      : t("tickets.priceNotSet");

  return (
    <article className="ticket-application-card">
      <div className="ticket-application-card__header">
        <div>
          <span className={`status-badge status-badge--${application.status}`}>
            {t(`status.${application.status}`)}
          </span>
          <h3>{application.eventTitle}</h3>
          <p>{application.artist}</p>
        </div>
        <strong>{t(`platform.${application.platform}`)}</strong>
      </div>

      <dl className="ticket-application-card__details">
        <div>
          <dt>{t("tickets.venue")}</dt>
          <dd>{application.venueName || t("tickets.noVenue")}</dd>
        </div>
        <div>
          <dt>{t("tickets.eventDate")}</dt>
          <dd>{application.eventDate ? formatDate(application.eventDate) : "-"}</dd>
        </div>
        <div>
          <dt>{t("tickets.price")}</dt>
          <dd>{priceLabel}</dd>
        </div>
        <div>
          <dt>{t("tickets.quantity")}</dt>
          <dd>{application.quantity ?? 1}</dd>
        </div>
        <div>
          <dt>{t("tickets.companion")}</dt>
          <dd>{application.companionName || t("tickets.solo")}</dd>
        </div>
      </dl>

      <div className="important-dates">
        <Calendar size={16} aria-hidden="true" />
        <span>{dateLine(t("tickets.apply"), application.applicationDate)}</span>
        <span>{dateLine(t("tickets.result"), application.resultDate)}</span>
        <span>{dateLine(t("tickets.pay"), application.paymentDeadline)}</span>
        <span>{dateLine(t("tickets.issue"), application.issueDate)}</span>
      </div>

      {paymentPending ? <p className="ticket-warning">{t("tickets.paymentPending")}</p> : null}
      {ticketNotIssued ? <p className="ticket-warning">{t("tickets.ticketNotIssued")}</p> : null}
      {overdue ? <p className="ticket-warning ticket-warning--overdue">{t("tickets.overdue")}</p> : null}
      {memoPreview ? <p className="ticket-application-card__memo">{memoPreview}</p> : null}

      <div className="ticket-application-card__actions">
        <button className="icon-button" type="button" onClick={() => onEdit(application)}>
          <Pencil size={16} aria-hidden="true" />
          {t("common.edit")}
        </button>
        <button className="icon-button" type="button" onClick={() => onDelete(application.id)}>
          <Trash2 size={16} aria-hidden="true" />
          {t("common.delete")}
        </button>
        {application.linkedEventId ? (
          <span className="linked-event-badge">{t("tickets.alreadyCreated")}</span>
        ) : canCreateEventRecord(application) ? (
          <button className="icon-button icon-button--weather" type="button" onClick={() => onCreateEventRecord(application)}>
            <PlusCircle size={16} aria-hidden="true" />
            {t("tickets.createEventRecord")}
          </button>
        ) : null}
      </div>
    </article>
  );
}
