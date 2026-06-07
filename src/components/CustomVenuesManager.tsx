import { Pencil, PlusCircle, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CustomVenueInput, CustomVenueUpdate } from "../services/customVenueService";
import type { EventRecord } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import type { CustomVenue, CustomVenueCategory } from "../types/venue";
import { normalizeVenueSearchText } from "../utils/venueSearchUtils";

interface CustomVenuesManagerProps {
  customVenues: CustomVenue[];
  customVenuesLoading?: boolean;
  customVenueError?: string | null;
  events: EventRecord[];
  ticketApplications: TicketApplication[];
  onCreateCustomVenue: (input: CustomVenueInput) => Promise<CustomVenue> | CustomVenue;
  onUpdateCustomVenue: (id: string, updates: CustomVenueUpdate) => Promise<CustomVenue> | CustomVenue;
  onDeleteCustomVenue: (id: string) => Promise<void> | void;
}

type CustomVenueFormState = {
  name: string;
  nameJa: string;
  nameZh: string;
  aliases: string;
  city: string;
  country: string;
  prefecture: string;
  region: string;
  latitude: string;
  longitude: string;
  category: "" | CustomVenueCategory;
  capacity: string;
  notes: string;
};

type UsageSummary = {
  usedByEventsCount: number;
  usedByTicketsCount: number;
};

const categoryOptions: CustomVenueCategory[] = [
  "dome",
  "arena",
  "hall",
  "livehouse",
  "convention",
  "stadium",
  "theater",
  "other",
];

const emptyForm: CustomVenueFormState = {
  name: "",
  nameJa: "",
  nameZh: "",
  aliases: "",
  city: "",
  country: "Japan",
  prefecture: "",
  region: "",
  latitude: "",
  longitude: "",
  category: "",
  capacity: "",
  notes: "",
};

const getSnapshotKey = (value: { venueName?: string; name?: string; city?: string; country?: string }) =>
  normalizeVenueSearchText(`${value.venueName ?? value.name ?? ""} ${value.city ?? ""} ${value.country ?? ""}`);

const parseOptionalNumber = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const parseOptionalCapacity = (value: string) => {
  const number = parseOptionalNumber(value);
  return typeof number === "number" && number >= 0 ? number : undefined;
};

const toFormState = (venue?: CustomVenue): CustomVenueFormState =>
  venue
    ? {
        name: venue.name,
        nameJa: venue.nameJa ?? "",
        nameZh: venue.nameZh ?? "",
        aliases: venue.aliases?.join(", ") ?? "",
        city: venue.city,
        country: venue.country,
        prefecture: venue.prefecture ?? "",
        region: venue.region ?? "",
        latitude: typeof venue.latitude === "number" ? String(venue.latitude) : "",
        longitude: typeof venue.longitude === "number" ? String(venue.longitude) : "",
        category: venue.category ?? "",
        capacity: typeof venue.capacity === "number" ? String(venue.capacity) : "",
        notes: venue.notes ?? "",
      }
    : emptyForm;

const toInput = (values: CustomVenueFormState): CustomVenueInput & CustomVenueUpdate => ({
  name: values.name.trim(),
  nameJa: values.nameJa.trim() || undefined,
  nameZh: values.nameZh.trim() || undefined,
  aliases: values.aliases
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean),
  city: values.city.trim() || "Unknown",
  country: values.country.trim() || "Japan",
  prefecture: values.prefecture.trim() || undefined,
  region: values.region.trim() || undefined,
  latitude: parseOptionalNumber(values.latitude),
  longitude: parseOptionalNumber(values.longitude),
  category: values.category || undefined,
  capacity: parseOptionalCapacity(values.capacity),
  notes: values.notes.trim() || undefined,
});

const getUsageSummary = (
  venue: CustomVenue,
  events: EventRecord[],
  ticketApplications: TicketApplication[],
): UsageSummary => {
  const venueKey = getSnapshotKey({ name: venue.name, city: venue.city, country: venue.country });
  const matchesVenue = (record: { venueId?: string; venueName?: string; city?: string; country?: string }) =>
    record.venueId === venue.id || (!record.venueId && getSnapshotKey(record) === venueKey) || getSnapshotKey(record) === venueKey;

  return {
    usedByEventsCount: events.filter(matchesVenue).length,
    usedByTicketsCount: ticketApplications.filter(matchesVenue).length,
  };
};

export function CustomVenuesManager({
  customVenues,
  customVenuesLoading = false,
  customVenueError,
  events,
  ticketApplications,
  onCreateCustomVenue,
  onUpdateCustomVenue,
  onDeleteCustomVenue,
}: CustomVenuesManagerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [editingVenue, setEditingVenue] = useState<CustomVenue | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<CustomVenueFormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const normalizedSearch = normalizeVenueSearchText(search);

  const usageByVenueId = useMemo(
    () =>
      customVenues.reduce<Record<string, UsageSummary>>(
        (result, venue) => ({
          ...result,
          [venue.id]: getUsageSummary(venue, events, ticketApplications),
        }),
        {},
      ),
    [customVenues, events, ticketApplications],
  );
  const filteredVenues = useMemo(
    () =>
      customVenues.filter((venue) => {
        if (!normalizedSearch) {
          return true;
        }

        return normalizeVenueSearchText(
          [
            venue.name,
            venue.nameJa,
            venue.nameZh,
            ...(venue.aliases ?? []),
            venue.city,
            venue.country,
            venue.prefecture,
            venue.region,
            venue.category,
            venue.notes,
          ]
            .filter(Boolean)
            .join(" "),
        ).includes(normalizedSearch);
      }),
    [customVenues, normalizedSearch],
  );

  const updateField = (field: keyof CustomVenueFormState, value: string) => {
    setFormError("");
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const openCreateForm = () => {
    setEditingVenue(null);
    setFormValues(emptyForm);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (venue: CustomVenue) => {
    setEditingVenue(venue);
    setFormValues(toFormState(venue));
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingVenue(null);
    setFormValues(emptyForm);
    setFormError("");
    setIsFormOpen(false);
  };

  const handleSubmit = async () => {
    if (!formValues.name.trim() || !formValues.city.trim() || !formValues.country.trim()) {
      setFormError(t("customVenues.requiredFields"));
      return;
    }

    if (formValues.capacity.trim() && parseOptionalCapacity(formValues.capacity) === undefined) {
      setFormError(t("customVenues.capacityError"));
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const input = toInput(formValues);

      if (editingVenue) {
        await onUpdateCustomVenue(editingVenue.id, input);
      } else {
        await onCreateCustomVenue(input);
      }

      closeForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("customVenues.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (venue: CustomVenue) => {
    const usage = usageByVenueId[venue.id] ?? { usedByEventsCount: 0, usedByTicketsCount: 0 };
    const confirmed = window.confirm(
      `${t("customVenues.deleteConfirm")}\n\n${t("customVenues.deleteUsageWarning", {
        events: usage.usedByEventsCount,
        tickets: usage.usedByTicketsCount,
      })}`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await onDeleteCustomVenue(venue.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("customVenues.deleteFailed"));
    }
  };

  return (
    <section className="custom-venues-manager" aria-labelledby="custom-venues-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("customVenues.library")}</span>
          <h2 id="custom-venues-title">{t("customVenues.myCustomVenues")}</h2>
          <p>{t("customVenues.syncedDescription")}</p>
          <p>{t("customVenues.snapshotDescription")}</p>
        </div>
        <button className="primary-button" type="button" onClick={openCreateForm}>
          <PlusCircle size={17} aria-hidden="true" />
          {t("customVenues.add")}
        </button>
      </div>

      <label className="search-field custom-venues-manager__search">
        <Search size={17} aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("customVenues.searchPlaceholder")}
        />
      </label>

      {customVenuesLoading ? <p className="draft-status">{t("venueSearch.loadingCustomVenues")}</p> : null}
      {customVenueError ? <p className="form-error">{customVenueError}</p> : null}
      {formError ? <p className="form-error">{formError}</p> : null}

      {isFormOpen ? (
        <section className="custom-venue-form" aria-label={editingVenue ? t("customVenues.edit") : t("customVenues.add")}>
          <div className="custom-venue-form__heading">
            <h3>{editingVenue ? t("customVenues.edit") : t("customVenues.add")}</h3>
            <button className="icon-button" type="button" onClick={closeForm}>
              <X size={16} aria-hidden="true" />
              {t("common.cancel")}
            </button>
          </div>
          <label>
            {t("venueSearch.venueName")}
            <input required value={formValues.name} onChange={(event) => updateField("name", event.target.value)} />
          </label>
          <label>
            {t("customVenues.nameJa")}
            <input value={formValues.nameJa} onChange={(event) => updateField("nameJa", event.target.value)} />
          </label>
          <label>
            {t("customVenues.nameZh")}
            <input value={formValues.nameZh} onChange={(event) => updateField("nameZh", event.target.value)} />
          </label>
          <label>
            {t("customVenues.aliases")}
            <input value={formValues.aliases} onChange={(event) => updateField("aliases", event.target.value)} />
          </label>
          <label>
            {t("venueSearch.city")}
            <input required value={formValues.city} onChange={(event) => updateField("city", event.target.value)} />
          </label>
          <label>
            {t("venueSearch.country")}
            <input required value={formValues.country} onChange={(event) => updateField("country", event.target.value)} />
          </label>
          <label>
            {t("venueSearch.prefecture")}
            <input value={formValues.prefecture} onChange={(event) => updateField("prefecture", event.target.value)} />
          </label>
          <label>
            {t("venueSearch.region")}
            <input value={formValues.region} onChange={(event) => updateField("region", event.target.value)} />
          </label>
          <label>
            {t("venueSearch.latitude")}
            <input value={formValues.latitude} onChange={(event) => updateField("latitude", event.target.value)} />
          </label>
          <label>
            {t("venueSearch.longitude")}
            <input value={formValues.longitude} onChange={(event) => updateField("longitude", event.target.value)} />
          </label>
          <label>
            {t("venues.category")}
            <select value={formValues.category} onChange={(event) => updateField("category", event.target.value)}>
              <option value="">{t("common.optional")}</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {t(`venues.categories.${category}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("customVenues.capacity")}
            <input min="0" type="number" value={formValues.capacity} onChange={(event) => updateField("capacity", event.target.value)} />
          </label>
          <label className="custom-venue-form__wide">
            {t("customVenues.notes")}
            <textarea rows={3} value={formValues.notes} onChange={(event) => updateField("notes", event.target.value)} />
          </label>
          <button className="primary-button custom-venue-form__submit" type="button" disabled={isSaving} onClick={() => void handleSubmit()}>
            {isSaving
              ? t("common.saving")
              : editingVenue
                ? t("customVenues.updateVenue")
                : t("customVenues.saveVenue")}
          </button>
        </section>
      ) : null}

      {filteredVenues.length > 0 ? (
        <div className="custom-venue-grid">
          {filteredVenues.map((venue) => {
            const usage = usageByVenueId[venue.id] ?? { usedByEventsCount: 0, usedByTicketsCount: 0 };

            return (
              <article className="custom-venue-card" key={venue.id}>
                <div>
                  <span className="eyebrow">{t("customVenues.library")}</span>
                  <h3>{venue.name}</h3>
                  {venue.nameJa || venue.nameZh ? <p>{[venue.nameJa, venue.nameZh].filter(Boolean).join(" / ")}</p> : null}
                  <p>{[venue.city, venue.prefecture ?? venue.region, venue.country].filter(Boolean).join(" / ")}</p>
                </div>
                <div className="custom-venue-card__meta">
                  {venue.category ? <span className="venue-tag">{t(`venues.categories.${venue.category}`)}</span> : null}
                  {typeof venue.capacity === "number" ? <span className="venue-tag">{t("customVenues.capacity")}: {venue.capacity.toLocaleString()}</span> : null}
                  <span className="venue-tag">{t("customVenues.usedByEvents", { count: usage.usedByEventsCount })}</span>
                  <span className="venue-tag">{t("customVenues.usedByTickets", { count: usage.usedByTicketsCount })}</span>
                </div>
                {venue.aliases?.length ? <p>{t("customVenues.aliases")}: {venue.aliases.join(", ")}</p> : null}
                {venue.notes ? <p>{venue.notes}</p> : null}
                <p className="custom-venue-card__snapshot">{t("customVenues.deleteNoHistoricalRecords")}</p>
                <div className="custom-venue-card__actions">
                  <button className="ghost-button" type="button" onClick={() => openEditForm(venue)}>
                    <Pencil size={16} aria-hidden="true" />
                    {t("customVenues.edit")}
                  </button>
                  <button className="ghost-button ghost-button--danger" type="button" onClick={() => void handleDelete(venue)}>
                    <Trash2 size={16} aria-hidden="true" />
                    {t("customVenues.delete")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="empty-state empty-state--compact">
          <p>{search ? t("venues.noMatchingVenues") : t("customVenues.empty")}</p>
          <button className="ghost-button" type="button" onClick={openCreateForm}>
            <PlusCircle size={16} aria-hidden="true" />
            {t("customVenues.createFirst")}
          </button>
        </section>
      )}
    </section>
  );
}
