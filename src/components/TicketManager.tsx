import { Search, TicketCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Venue } from "../types/event";
import type {
  TicketApplication,
  TicketApplicationFilters,
  TicketApplicationFormValues,
} from "../types/ticket";
import { platformLabels, platformOptions, statusLabels, statusOptions } from "../utils/ticketUtils";
import { TicketApplicationCard } from "./TicketApplicationCard";
import { TicketApplicationForm } from "./TicketApplicationForm";

interface TicketManagerProps {
  applications: TicketApplication[];
  venues: Venue[];
  editingApplication: TicketApplication | null;
  onSave: (values: TicketApplicationFormValues, editingApplication?: TicketApplication | null) => void;
  onEdit: (application: TicketApplication) => void;
  onCancelEditing: () => void;
  onDelete: (id: string) => void;
  onCreateEventRecord: (application: TicketApplication) => void;
}

const defaultFilters: TicketApplicationFilters = {
  status: "all",
  platform: "all",
  search: "",
};

export function TicketManager({
  applications,
  venues,
  editingApplication,
  onSave,
  onEdit,
  onCancelEditing,
  onDelete,
  onCreateEventRecord,
}: TicketManagerProps) {
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

  return (
    <section className="ticket-manager">
      <TicketApplicationForm
        editingApplication={editingApplication}
        venues={venues}
        onCancel={onCancelEditing}
        onSave={(values) => onSave(values, editingApplication)}
      />

      <div className="section-heading">
        <div>
          <span className="eyebrow">Lottery board</span>
          <h2>Ticket Manager</h2>
        </div>
      </div>

      <div className="ticket-status-tabs">
        <button
          className={filters.status === "all" ? "is-active" : undefined}
          type="button"
          onClick={() => setFilters((current) => ({ ...current, status: "all" }))}
        >
          All
        </button>
        {statusOptions.map((status) => (
          <button
            className={filters.status === status ? "is-active" : undefined}
            key={status}
            type="button"
            onClick={() => setFilters((current) => ({ ...current, status }))}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>

      <section className="filter-bar ticket-filter-bar" aria-label="Ticket application filters">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search event, artist, companion..."
          />
        </label>
        <label>
          Platform
          <select
            value={filters.platform}
            onChange={(event) => setFilters((current) => ({ ...current, platform: event.target.value as TicketApplicationFilters["platform"] }))}
          >
            <option value="all">All platforms</option>
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {platformLabels[platform]}
              </option>
            ))}
          </select>
        </label>
      </section>

      {filteredApplications.length > 0 ? (
        <section className="ticket-application-grid" aria-label="Ticket applications">
          {filteredApplications.map((application) => (
            <TicketApplicationCard
              application={application}
              key={application.id}
              onCreateEventRecord={onCreateEventRecord}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <TicketCheck size={28} aria-hidden="true" />
          <h2>No ticket applications</h2>
          <p>Add a lottery record or adjust the filters.</p>
        </section>
      )}
    </section>
  );
}
