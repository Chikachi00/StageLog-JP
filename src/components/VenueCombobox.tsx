import { MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EventRecord, Venue } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import {
  buildCustomVenueId,
  extractHistoricalCustomVenues,
  normalizeVenueSearchText,
  searchVenues,
  type VenueCandidate,
  type VenueValue,
} from "../utils/venueSearchUtils";

interface VenueComboboxProps {
  venues: Venue[];
  events?: EventRecord[];
  ticketApplications?: TicketApplication[];
  value: VenueValue;
  onChange: (value: VenueValue) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const getDisplayValue = (value: VenueValue, venues: Venue[]) =>
  value.venueName || venues.find((venue) => venue.id === value.venueId)?.name || "";

const toVenueValue = (candidate: VenueCandidate): VenueValue => ({
  venueId: candidate.venueId,
  venueName: candidate.venueName,
  city: candidate.city,
  country: candidate.country,
  prefecture: candidate.prefecture,
  region: candidate.region,
  latitude: candidate.latitude,
  longitude: candidate.longitude,
  isCustomVenue: candidate.source === "custom",
});

const parseOptionalNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

export function VenueCombobox({
  venues,
  events = [],
  ticketApplications = [],
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
}: VenueComboboxProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(() => getDisplayValue(value, venues));
  const [isOpen, setIsOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customVenue, setCustomVenue] = useState({
    venueName: value.isCustomVenue ? value.venueName ?? "" : "",
    city: value.isCustomVenue ? value.city ?? "" : "",
    country: value.isCustomVenue ? value.country ?? "Japan" : "Japan",
    prefecture: value.isCustomVenue ? value.prefecture ?? "" : "",
    region: value.isCustomVenue ? value.region ?? "" : "",
    latitude: typeof value.latitude === "number" ? String(value.latitude) : "",
    longitude: typeof value.longitude === "number" ? String(value.longitude) : "",
  });
  const normalizedQuery = normalizeVenueSearchText(query);
  const builtInResults = useMemo(() => searchVenues(venues, query), [query, venues]);
  const customHistory = useMemo(
    () => extractHistoricalCustomVenues(events, ticketApplications, venues),
    [events, ticketApplications, venues],
  );
  const customResults = useMemo(() => {
    if (!normalizedQuery) {
      return customHistory.slice(0, 8);
    }

    return customHistory.filter((candidate) => candidate.searchText.includes(normalizedQuery)).slice(0, 8);
  }, [customHistory, normalizedQuery]);
  const hasResults = builtInResults.length > 0 || customResults.length > 0;
  const canUseCustom = query.trim().length > 0;
  const showRecentCustomLabel = !normalizedQuery && customResults.length > 0;

  useEffect(() => {
    setQuery(getDisplayValue(value, venues));
    setCustomVenue({
      venueName: value.isCustomVenue ? value.venueName ?? "" : "",
      city: value.isCustomVenue ? value.city ?? "" : "",
      country: value.isCustomVenue ? value.country ?? "Japan" : "Japan",
      prefecture: value.isCustomVenue ? value.prefecture ?? "" : "",
      region: value.isCustomVenue ? value.region ?? "" : "",
      latitude: typeof value.latitude === "number" ? String(value.latitude) : "",
      longitude: typeof value.longitude === "number" ? String(value.longitude) : "",
    });
  }, [
    value.city,
    value.country,
    value.isCustomVenue,
    value.latitude,
    value.longitude,
    value.prefecture,
    value.region,
    value.venueId,
    value.venueName,
    venues,
  ]);

  const selectCandidate = (candidate: VenueCandidate) => {
    onChange(toVenueValue(candidate));
    setQuery(candidate.label);
    setCustomMode(false);
    setIsOpen(false);
  };

  const startCustomMode = () => {
    setCustomVenue((current) => ({
      ...current,
      venueName: query.trim(),
      city: current.city,
      country: current.country || "Japan",
    }));
    setCustomMode(true);
    setIsOpen(false);
  };

  const applyCustomVenue = () => {
    const venueName = customVenue.venueName.trim() || query.trim();
    const city = customVenue.city.trim() || "Unknown";
    const country = customVenue.country.trim() || "Japan";

    if (!venueName) {
      return;
    }

    const nextValue: VenueValue = {
      venueId: buildCustomVenueId(venueName, city),
      venueName,
      city,
      country,
      prefecture: customVenue.prefecture.trim() || undefined,
      region: customVenue.region.trim() || undefined,
      latitude: parseOptionalNumber(customVenue.latitude),
      longitude: parseOptionalNumber(customVenue.longitude),
      isCustomVenue: true,
    };

    onChange(nextValue);
    setQuery(venueName);
    setCustomMode(false);
  };

  return (
    <div className="venue-combobox">
      <label>
        {label ?? t("venueSearch.selectVenue")}
        <div className="venue-combobox__input">
          <Search size={16} aria-hidden="true" />
          <input
            disabled={disabled}
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (!nextQuery.trim()) {
                onChange({
                  venueId: "",
                  venueName: "",
                  city: "",
                  country: "Japan",
                  isCustomVenue: false,
                });
              }
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder ?? t("venueSearch.searchPlaceholder")}
            aria-label={t("venueSearch.searchVenue")}
          />
        </div>
      </label>

      {isOpen ? (
        <div className="venue-combobox__list" role="listbox">
          {hasResults ? (
            <>
              {builtInResults.map((candidate) => (
                <button
                  className="venue-combobox__option"
                  key={`${candidate.source}-${candidate.id}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCandidate(candidate)}
                >
                  <MapPin size={16} aria-hidden="true" />
                  <span>
                    <strong>{candidate.label}</strong>
                    <small>{candidate.detail || t("venueSearch.noVenueFound")}</small>
                  </span>
                  <em>{t("venueSearch.builtInVenue")}</em>
                </button>
              ))}
              {showRecentCustomLabel ? (
                <span className="venue-combobox__group-label">{t("venueSearch.recentCustomVenues")}</span>
              ) : null}
              {customResults.map((candidate) => (
                <button
                  className="venue-combobox__option"
                  key={`${candidate.source}-${candidate.id}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCandidate(candidate)}
                >
                  <MapPin size={16} aria-hidden="true" />
                  <span>
                    <strong>{candidate.label}</strong>
                    <small>{candidate.detail || t("venueSearch.noVenueFound")}</small>
                  </span>
                  <em>{t("venueSearch.customVenue")}</em>
                </button>
              ))}
            </>
          ) : (
            <p className="venue-combobox__empty">{t("venueSearch.noVenueFound")}</p>
          )}
          {canUseCustom ? (
            <button
              className="venue-combobox__option venue-combobox__option--custom"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={startCustomMode}
            >
              <MapPin size={16} aria-hidden="true" />
              <span>
                <strong>{t("venueSearch.useCustomVenue", { name: query.trim() })}</strong>
                <small>{t("venueSearch.addCustomVenue")}</small>
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      {customMode ? (
        <section className="venue-combobox__custom" aria-label={t("venueSearch.customVenue")}>
          <label>
            {t("venueSearch.venueName")}
            <input
              value={customVenue.venueName}
              onChange={(event) => setCustomVenue((current) => ({ ...current, venueName: event.target.value }))}
            />
          </label>
          <label>
            {t("venueSearch.city")}
            <input
              value={customVenue.city}
              onChange={(event) => setCustomVenue((current) => ({ ...current, city: event.target.value }))}
            />
          </label>
          <label>
            {t("venueSearch.country")}
            <input
              value={customVenue.country}
              onChange={(event) => setCustomVenue((current) => ({ ...current, country: event.target.value }))}
            />
          </label>
          <label>
            {t("venueSearch.prefecture")}
            <input
              value={customVenue.prefecture}
              onChange={(event) => setCustomVenue((current) => ({ ...current, prefecture: event.target.value }))}
            />
          </label>
          <label>
            {t("venueSearch.region")}
            <input
              value={customVenue.region}
              onChange={(event) => setCustomVenue((current) => ({ ...current, region: event.target.value }))}
            />
          </label>
          <label>
            {t("venueSearch.latitude")}
            <input
              value={customVenue.latitude}
              onChange={(event) => setCustomVenue((current) => ({ ...current, latitude: event.target.value }))}
            />
          </label>
          <label>
            {t("venueSearch.longitude")}
            <input
              value={customVenue.longitude}
              onChange={(event) => setCustomVenue((current) => ({ ...current, longitude: event.target.value }))}
            />
          </label>
          <button className="ghost-button venue-combobox__custom-action" type="button" onClick={applyCustomVenue}>
            {t("venueSearch.addCustomVenue")}
          </button>
        </section>
      ) : null}
    </div>
  );
}
