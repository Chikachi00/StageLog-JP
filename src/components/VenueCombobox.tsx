import { MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CustomVenueInput } from "../services/customVenueService";
import type { EventRecord, Venue } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import type { CustomVenue } from "../types/venue";
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
  customVenues?: CustomVenue[];
  events?: EventRecord[];
  ticketApplications?: TicketApplication[];
  value: VenueValue;
  onChange: (value: VenueValue) => void;
  onCreateCustomVenue?: (input: CustomVenueInput) => Promise<CustomVenue> | CustomVenue;
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
  isCustomVenue: candidate.source !== "built-in",
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
  customVenues = [],
  value,
  onChange,
  onCreateCustomVenue,
  label,
  placeholder,
  disabled = false,
}: VenueComboboxProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(() => getDisplayValue(value, venues));
  const [isOpen, setIsOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customError, setCustomError] = useState("");
  const [isSavingCustomVenue, setIsSavingCustomVenue] = useState(false);
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
  const formalCustomCandidates = useMemo<VenueCandidate[]>(
    () =>
      customVenues.map((venue) => ({
        id: venue.id,
        venueId: venue.id,
        venueName: venue.name,
        city: venue.city,
        country: venue.country,
        prefecture: venue.prefecture,
        region: venue.region,
        latitude: venue.latitude,
        longitude: venue.longitude,
        isCustomVenue: true,
        label: venue.name,
        detail: [venue.nameJa, venue.nameZh, venue.city, venue.prefecture ?? venue.region, venue.country]
          .filter(Boolean)
          .join(" / "),
        searchText: normalizeVenueSearchText(
          [
            venue.name,
            venue.nameJa,
            venue.nameZh,
            ...(venue.aliases ?? []),
            venue.city,
            venue.prefecture,
            venue.region,
            venue.country,
            venue.category,
          ]
            .filter(Boolean)
            .join(" "),
        ),
        source: "custom",
        category: venue.category,
        capacity: venue.capacity,
        aliases: venue.aliases,
        names: [venue.name, venue.nameJa, venue.nameZh].filter((name): name is string => Boolean(name)),
      })),
    [customVenues],
  );
  const customVenueResults = useMemo(() => {
    if (!normalizedQuery) {
      return formalCustomCandidates.slice(0, 8);
    }

    return formalCustomCandidates.filter((candidate) => candidate.searchText.includes(normalizedQuery)).slice(0, 8);
  }, [formalCustomCandidates, normalizedQuery]);
  const customHistory = useMemo(
    () => extractHistoricalCustomVenues(events, ticketApplications, venues),
    [events, ticketApplications, venues],
  );
  const customResults = useMemo(() => {
    const formalIds = new Set(customVenues.map((venue) => venue.id));
    const formalNames = new Set(
      customVenues.map((venue) => normalizeVenueSearchText(`${venue.name} ${venue.city} ${venue.country}`)),
    );
    const dedupedHistory = customHistory.filter(
      (candidate) =>
        !formalIds.has(candidate.venueId ?? "") &&
        !formalNames.has(normalizeVenueSearchText(`${candidate.venueName} ${candidate.city} ${candidate.country}`)),
    );

    if (!normalizedQuery) {
      return dedupedHistory.slice(0, 8);
    }

    return dedupedHistory.filter((candidate) => candidate.searchText.includes(normalizedQuery)).slice(0, 8);
  }, [customHistory, customVenues, normalizedQuery]);
  const hasResults = builtInResults.length > 0 || customVenueResults.length > 0 || customResults.length > 0;
  const canUseCustom = query.trim().length > 0;
  const showCustomVenueLabel = customVenueResults.length > 0;
  const showRecentCustomLabel = customResults.length > 0;

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
    setCustomError("");
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

  const applyCustomVenue = async () => {
    const venueName = customVenue.venueName.trim() || query.trim();
    const city = customVenue.city.trim() || "Unknown";
    const country = customVenue.country.trim() || "Japan";

    if (!venueName) {
      return;
    }

    const input: CustomVenueInput = {
      name: venueName,
      city,
      country,
      prefecture: customVenue.prefecture.trim() || undefined,
      region: customVenue.region.trim() || undefined,
      latitude: customVenue.latitude,
      longitude: customVenue.longitude,
    };

    try {
      setIsSavingCustomVenue(true);
      setCustomError("");

      if (onCreateCustomVenue) {
        const savedVenue = await onCreateCustomVenue(input);
        selectCandidate({
          id: savedVenue.id,
          venueId: savedVenue.id,
          venueName: savedVenue.name,
          city: savedVenue.city,
          country: savedVenue.country,
          prefecture: savedVenue.prefecture,
          region: savedVenue.region,
          latitude: savedVenue.latitude,
          longitude: savedVenue.longitude,
          isCustomVenue: true,
          label: savedVenue.name,
          detail: [savedVenue.city, savedVenue.prefecture ?? savedVenue.region, savedVenue.country].filter(Boolean).join(" / "),
          searchText: normalizeVenueSearchText(
            [savedVenue.name, savedVenue.city, savedVenue.prefecture, savedVenue.region, savedVenue.country]
              .filter(Boolean)
              .join(" "),
          ),
          source: "custom",
        });
        return;
      }

      const nextValue: VenueValue = {
        venueId: buildCustomVenueId(venueName, city),
        venueName,
        city,
        country,
        prefecture: input.prefecture,
        region: input.region,
        latitude: parseOptionalNumber(customVenue.latitude),
        longitude: parseOptionalNumber(customVenue.longitude),
        isCustomVenue: true,
      };

      onChange(nextValue);
      setQuery(venueName);
      setCustomMode(false);
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : t("venueSearch.failedSaveCustomVenue"));
    } finally {
      setIsSavingCustomVenue(false);
    }
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
              {showCustomVenueLabel ? (
                <span className="venue-combobox__group-label">{t("venueSearch.myCustomVenues")}</span>
              ) : null}
              {customVenueResults.map((candidate) => (
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
                    <small>{candidate.detail || t("venueSearch.customVenueLibrary")}</small>
                  </span>
                  <em>{t("venueSearch.customVenue")}</em>
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
                    <small>{candidate.detail || t("venueSearch.recentCustomVenueInferred")}</small>
                  </span>
                  <em>{t("venueSearch.recentCustomVenues")}</em>
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
          <p className="venue-combobox__hint">{t("venueSearch.syncedCustomVenue")}</p>
          {customError ? <p className="form-error venue-combobox__error">{customError}</p> : null}
          <button
            className="ghost-button venue-combobox__custom-action"
            type="button"
            disabled={isSavingCustomVenue}
            onClick={() => void applyCustomVenue()}
          >
            {isSavingCustomVenue ? t("common.saving") : t("venueSearch.addCustomVenue")}
          </button>
        </section>
      ) : null}
    </div>
  );
}
