import { MapPinned, Pencil, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  compareVenues,
  getVenueRegion,
  venueCategoryOrder,
  venueMatchesSearch,
  venueRegionOrder,
  venues,
} from "../data/venues";
import type { EventRecord, Venue } from "../types/event";
import { formatDate, sortByDateDesc } from "../utils/dateUtils";
import {
  formatSeatText,
  getEventSeatMapMarker,
  getSeatMapByVenueId,
} from "../utils/seatMapUtils";
import { VenueMap } from "./VenueMap";

interface VenuesPageProps {
  events: EventRecord[];
  selectedVenueId?: string;
  onEdit: (event: EventRecord) => void;
}

const isVenueCategory = (category: Venue["category"]): category is NonNullable<Venue["category"]> =>
  Boolean(category);

export function VenuesPage({ events, selectedVenueId, onEdit }: VenuesPageProps) {
  const { t } = useTranslation();
  const [activeVenueId, setActiveVenueId] = useState(selectedVenueId ?? venues[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (selectedVenueId) {
      setActiveVenueId(selectedVenueId);
    }
  }, [selectedVenueId]);

  const regionOptions = useMemo(
    () =>
      Array.from(new Set(venues.map(getVenueRegion))).sort((first, second) => {
        const firstIndex = venueRegionOrder.indexOf(first);
        const secondIndex = venueRegionOrder.indexOf(second);
        const normalizedFirst = firstIndex === -1 ? Number.POSITIVE_INFINITY : firstIndex;
        const normalizedSecond = secondIndex === -1 ? Number.POSITIVE_INFINITY : secondIndex;
        return normalizedFirst === normalizedSecond ? first.localeCompare(second) : normalizedFirst - normalizedSecond;
      }),
    [],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(venues.map((venue) => venue.category).filter(isVenueCategory))).sort(
        (first, second) =>
          venueCategoryOrder.indexOf(first) - venueCategoryOrder.indexOf(second),
      ),
    [],
  );
  const attendanceCounts = useMemo(
    () =>
      events.reduce<Record<string, number>>((counts, event) => {
        counts[event.venueId] = (counts[event.venueId] ?? 0) + 1;
        return counts;
      }, {}),
    [events],
  );
  const filteredVenues = useMemo(
    () =>
      venues
        .filter((venue) => regionFilter === "all" || getVenueRegion(venue) === regionFilter)
        .filter((venue) => categoryFilter === "all" || venue.category === categoryFilter)
        .filter((venue) => venueMatchesSearch(venue, search))
        .sort(compareVenues),
    [categoryFilter, regionFilter, search],
  );

  useEffect(() => {
    if (filteredVenues.length > 0 && !filteredVenues.some((venue) => venue.id === activeVenueId)) {
      setActiveVenueId(filteredVenues[0].id);
    }
  }, [activeVenueId, filteredVenues]);

  const activeVenue =
    filteredVenues.find((venue) => venue.id === activeVenueId) ??
    venues.find((venue) => venue.id === activeVenueId) ??
    filteredVenues[0] ??
    venues[0];
  const venueEvents = useMemo(
    () => sortByDateDesc(events.filter((event) => event.venueId === activeVenue?.id)),
    [activeVenue?.id, events],
  );
  const activeSeatMap = activeVenue ? getSeatMapByVenueId(activeVenue.id) : undefined;
  const markerEntries = venueEvents
    .map((event, index) => ({
      event,
      marker: getEventSeatMapMarker(event, activeSeatMap, index),
    }))
    .filter((entry): entry is { event: EventRecord; marker: NonNullable<typeof entry.marker> } =>
      Boolean(entry.marker),
    );
  const markerIndexByEventId = markerEntries.reduce<Record<string, number>>(
    (result, entry, index) => ({ ...result, [entry.event.id]: index + 1 }),
    {},
  );

  if (venues.length === 0) {
    return (
      <section className="empty-state">
        <MapPinned size={28} aria-hidden="true" />
        <h2>{t("venues.emptyTitle")}</h2>
        <p>{t("venues.emptyDescription")}</p>
      </section>
    );
  }

  return (
    <section className="venues-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("venues.eyebrow")}</span>
          <h2>{t("venues.title")}</h2>
        </div>
        <span className="venue-count-summary">
          {t("venues.venueCount", { count: filteredVenues.length, total: venues.length })}
        </span>
      </div>

      <div className="venue-filters">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("venues.searchPlaceholder")}
          />
        </label>

        <label>
          {t("venues.region")}
          <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
            <option value="all">{t("venues.allRegions")}</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("venues.category")}
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">{t("venues.allCategories")}</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {t(`venues.categories.${category}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="venue-tabs">
        {filteredVenues.map((venue) => {
          const count = attendanceCounts[venue.id] ?? 0;

          return (
            <button
              className={activeVenue.id === venue.id ? "is-active" : undefined}
              key={venue.id}
              type="button"
              onClick={() => setActiveVenueId(venue.id)}
            >
              <strong>{venue.name}</strong>
              {venue.nameJa ? <small>{venue.nameJa}</small> : null}
              <small>{[venue.city, venue.prefecture].filter(Boolean).join(" / ")}</small>
              <span className="venue-tab-badges">
                <span className="venue-tag">{venue.category ? t(`venues.categories.${venue.category}`) : t("venues.categories.other")}</span>
                <span className="venue-tag">{venue.supportedSeatMap ? t("venues.seatMapSupported") : t("venues.seatMapUnsupported")}</span>
                <span className="venue-tab-count">{count}</span>
              </span>
            </button>
          );
        })}
      </div>

      {filteredVenues.length > 0 && activeVenue ? (
        <div className="venue-detail-grid">
          <section className="venue-map-panel">
            <div className="venue-map-panel__heading">
              <div>
                <h3>{activeVenue.name}</h3>
                {activeVenue.nameJa ? <p>{activeVenue.nameJa}</p> : null}
                <p>
                  {[activeVenue.city, activeVenue.prefecture, getVenueRegion(activeVenue)].filter(Boolean).join(" / ")}
                </p>
                <p>
                  {t("venues.eventRecords", { count: venueEvents.length })} / {t("venues.seatMarkers", { count: markerEntries.length })}
                </p>
              </div>
            </div>
            <VenueMap venue={activeVenue} events={venueEvents} />
          </section>

          <section className="venue-history">
            <h3>{t("venues.history")}</h3>
            {venueEvents.length > 0 ? (
              <div className="venue-history-list">
                {venueEvents.map((event, index) => (
                  <article key={event.id}>
                    <span className="marker-number">
                      {markerIndexByEventId[event.id] ?? "-"}
                    </span>
                    <div>
                      <strong>{event.title}</strong>
                      <p>
                        {event.artist} - {formatDate(event.date)}
                      </p>
                      <small>
                        {event.seat?.sectionLabel ? `${t("seatMap.section")}: ${event.seat.sectionLabel} / ` : ""}
                        {formatSeatText(event.seat ?? {}) || t("seat.noMarker")}
                        {markerIndexByEventId[event.id] ? ` / ${t("seatMap.positionSaved")}` : ""}
                      </small>
                    </div>
                    <button className="icon-button" type="button" onClick={() => onEdit(event)}>
                      <Pencil size={16} aria-hidden="true" />
                      {t("common.edit")}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state empty-state--compact">
                <p>{t("venues.noEvents")}</p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <section className="empty-state empty-state--compact">
          <MapPinned size={24} aria-hidden="true" />
          <p>{t("venues.noMatchingVenues")}</p>
        </section>
      )}
    </section>
  );
}
