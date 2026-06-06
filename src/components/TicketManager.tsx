import { Pencil, PlusCircle, Search, TicketCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Venue } from "../types/event";
import type {
  TicketApplication,
  TicketApplicationFilters,
  TicketApplicationFormValues,
} from "../types/ticket";
import { formatDate } from "../utils/dateUtils";
import {
  canCreateEventRecord,
  formatCurrencyAmount,
  formatTicketPrice,
  getAppliedQuantity,
  getTicketDisplayCurrency,
  getWonQuantity,
  groupTicketApplications,
  platformOptions,
  statusOptions,
} from "../utils/ticketUtils";
import { TicketApplicationForm } from "./TicketApplicationForm";

interface TicketManagerProps {
  applications: TicketApplication[];
  venues: Venue[];
  editingApplication: TicketApplication | null;
  isEditingApplicationLoading?: boolean;
  isEditingApplicationMissing?: boolean;
  onSave: (values: TicketApplicationFormValues, editingApplication?: TicketApplication | null) => void | Promise<void>;
  onEdit: (application: TicketApplication) => void;
  onCancelEditing: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onCreateEventRecord: (application: TicketApplication) => void | Promise<void>;
}

const defaultFilters: TicketApplicationFilters = {
  status: "all",
  platform: "all",
  search: "",
};

const formatRate = (rate: number | null) => (rate === null ? "N/A" : `${rate}%`);

export function TicketManager({
  applications,
  venues,
  editingApplication,
  isEditingApplicationLoading = false,
  isEditingApplicationMissing = false,
  onSave,
  onEdit,
  onCancelEditing,
  onDelete,
  onCreateEventRecord,
}: TicketManagerProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<TicketApplicationFilters>(defaultFilters);
  const filteredApplications = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = filters.status === "all" || application.status === filters.status;
      const matchesPlatform = filters.platform === "all" || application.platform === filters.platform;
      const matchesSearch =
        !search ||
        [
          application.eventTitle,
          application.artist,
          application.companionName ?? "",
          application.venueName ?? "",
        ].some((value) => value.toLowerCase().includes(search));

      return matchesStatus && matchesPlatform && matchesSearch;
    });
  }, [applications, filters]);
  const groupedApplications = useMemo(() => groupTicketApplications(filteredApplications), [filteredApplications]);

  return (
    <section className="ticket-manager">
      {isEditingApplicationLoading ? (
        <section className="empty-state">
          <h2>{t("tickets.loadingCloudTickets")}</h2>
        </section>
      ) : isEditingApplicationMissing ? (
        <section className="empty-state">
          <h2>{t("tickets.notFound")}</h2>
        </section>
      ) : (
        <TicketApplicationForm
          editingApplication={editingApplication}
          venues={venues}
          onCancel={onCancelEditing}
          onSave={(values) => void onSave(values, editingApplication)}
        />
      )}

      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("tickets.boardEyebrow")}</span>
          <h2>{t("tickets.manager")}</h2>
        </div>
      </div>

      <div className="ticket-status-tabs">
        <button
          className={filters.status === "all" ? "is-active" : undefined}
          type="button"
          onClick={() => setFilters((current) => ({ ...current, status: "all" }))}
        >
          {t("common.all")}
        </button>
        {statusOptions.map((status) => (
          <button
            className={filters.status === status ? "is-active" : undefined}
            key={status}
            type="button"
            onClick={() => setFilters((current) => ({ ...current, status }))}
          >
            {t(`status.${status}`)}
          </button>
        ))}
      </div>

      <section className="filter-bar ticket-filter-bar" aria-label={t("tickets.manager")}>
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder={t("tickets.searchPlaceholder")}
          />
        </label>
        <label>
          {t("tickets.platform")}
          <select
            value={filters.platform}
            onChange={(event) => setFilters((current) => ({ ...current, platform: event.target.value as TicketApplicationFilters["platform"] }))}
          >
            <option value="all">{t("tickets.allPlatforms")}</option>
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {t(`platform.${platform}`)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {groupedApplications.length > 0 ? (
        <section className="ticket-group-grid" aria-label={t("tickets.manager")}>
          {groupedApplications.map((group) => (
            <article className="ticket-group-card" key={group.key}>
              <div className="ticket-group-card__header">
                <div>
                  <span className="eyebrow">{t("tickets.ticketGroup")}</span>
                  <h3>{group.eventTitle || t("tickets.noApplications")}</h3>
                  <p>
                    {group.artist}
                    {group.eventDate ? ` / ${formatDate(group.eventDate)}` : ""}
                    {group.venueName ? ` / ${group.venueName}` : ""}
                  </p>
                </div>
                {group.applications.length > 1 ? (
                  <span className="linked-event-badge">{t("tickets.multipleRounds")}</span>
                ) : null}
              </div>

              <dl className="ticket-group-card__summary">
                <div>
                  <dt>{t("tickets.totalApplied")}</dt>
                  <dd>{group.totalAppliedQuantity}</dd>
                </div>
                <div>
                  <dt>{t("tickets.totalWon")}</dt>
                  <dd>{group.totalWonQuantity}</dd>
                </div>
                <div>
                  <dt>{t("tickets.resolvedRounds")}</dt>
                  <dd>
                    {group.wonRounds} / {group.resolvedRounds}
                  </dd>
                </div>
                <div>
                  <dt>{t("tickets.quantityWinRate")}</dt>
                  <dd>{formatRate(group.quantityWinRate)}</dd>
                </div>
                <div>
                  <dt>{t("tickets.roundWinRate")}</dt>
                  <dd>{formatRate(group.roundWinRate)}</dd>
                </div>
                <div>
                  <dt>{t("analytics.totalPaidAmount")}</dt>
                  <dd>{formatCurrencyAmount(group.totalPaidAmount, group.displayCurrency)}</dd>
                </div>
              </dl>

              <div className="ticket-round-list">
                {group.applications.map((application) => (
                  <article className="ticket-round-row" key={application.id}>
                    <div className="ticket-round-row__main">
                      <span className={`status-badge status-badge--${application.status}`}>
                        {t(`status.${application.status}`)}
                      </span>
                      <strong>
                        {application.roundName ||
                          (application.roundType ? t(`roundType.${application.roundType}`) : t("tickets.lotteryRound"))}
                      </strong>
                      <span>
                        {t(`platform.${application.platform}`)} / {t("tickets.appliedQuantity")}{" "}
                        {getAppliedQuantity(application)} / {t("tickets.wonQuantity")} {getWonQuantity(application)}
                      </span>
                      <span>
                        {formatTicketPrice(application)}
                        {getTicketDisplayCurrency(application) !== group.displayCurrency
                          ? ` (${getTicketDisplayCurrency(application)})`
                          : ""}
                      </span>
                    </div>
                    <div className="ticket-round-row__actions">
                      <button className="icon-button" type="button" onClick={() => onEdit(application)}>
                        <Pencil size={16} aria-hidden="true" />
                        {t("common.edit")}
                      </button>
                      <button className="icon-button" type="button" onClick={() => void onDelete(application.id)}>
                        <Trash2 size={16} aria-hidden="true" />
                        {t("common.delete")}
                      </button>
                      {application.linkedEventId ? (
                        <span className="linked-event-badge">{t("tickets.alreadyCreated")}</span>
                      ) : canCreateEventRecord(application) ? (
                        <button
                          className="icon-button icon-button--weather"
                          type="button"
                          onClick={() => void onCreateEventRecord(application)}
                        >
                          <PlusCircle size={16} aria-hidden="true" />
                          {t("tickets.createEventRecord")}
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <TicketCheck size={28} aria-hidden="true" />
          <h2>{t("tickets.noApplications")}</h2>
          <p>{t("tickets.noApplicationsDescription")}</p>
        </section>
      )}
    </section>
  );
}
