import { MapPinned } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EventRecord, Venue } from "../types/event";
import type { CustomVenue } from "../types/venue";
import { formatDate } from "../utils/dateUtils";
import {
  buildFootprintPoints,
  filterFootprintPoints,
  getFootprintCountryOptions,
  getFootprintYearOptions,
  getMissingCoordinateEvents,
} from "../utils/footprintMapUtils";
import { FootprintMap } from "./FootprintMap";

interface FootprintMapPageProps {
  events: EventRecord[];
  venues: Venue[];
  customVenues: CustomVenue[];
}

const ALL = "all";

export function FootprintMapPage({ events, venues, customVenues }: FootprintMapPageProps) {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState(ALL);
  const [selectedCountry, setSelectedCountry] = useState(ALL);

  const allPoints = useMemo(
    () => buildFootprintPoints(events, venues, customVenues),
    [customVenues, events, venues],
  );
  const allMissingEvents = useMemo(
    () => getMissingCoordinateEvents(events, venues, customVenues),
    [customVenues, events, venues],
  );
  const yearOptions = useMemo(() => getFootprintYearOptions(events), [events]);
  const countryOptions = useMemo(
    () => getFootprintCountryOptions(allPoints, allMissingEvents),
    [allMissingEvents, allPoints],
  );
  const filters = useMemo(
    () => ({ year: selectedYear, country: selectedCountry }),
    [selectedCountry, selectedYear],
  );
  const points = useMemo(() => filterFootprintPoints(allPoints, filters), [allPoints, filters]);
  const missingEvents = useMemo(
    () => getMissingCoordinateEvents(events, venues, customVenues, filters),
    [customVenues, events, filters, venues],
  );
  const cityCount = useMemo(
    () => new Set(points.map((point) => [point.city, point.country].filter(Boolean).join(", ")).filter(Boolean)).size,
    [points],
  );
  const venueCount = useMemo(
    () => new Set(points.map((point) => point.venueName).filter(Boolean)).size,
    [points],
  );

  return (
    <section className="footprint-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("footprint.eyebrow")}</span>
          <h2>{t("footprint.title")}</h2>
          <p>{t("footprint.description")}</p>
        </div>
      </div>

      <div className="footprint-toolbar" aria-label={t("footprint.filters")}>
        <label className="footprint-filter">
          {t("footprint.year")}
          <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
            <option value={ALL}>{t("footprint.allYears")}</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="footprint-filter">
          {t("footprint.country")}
          <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}>
            <option value={ALL}>{t("footprint.allCountries")}</option>
            {countryOptions.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="footprint-summary">
        {t("footprint.summary", {
          records: points.length,
          cities: cityCount,
          venues: venueCount,
          missing: missingEvents.length,
        })}
      </p>

      <section className="footprint-map-card">
        {points.length > 0 ? (
          <FootprintMap points={points} />
        ) : (
          <div className="footprint-map-empty">
            <MapPinned size={30} aria-hidden="true" />
            <h3>{t("footprint.emptyTitle")}</h3>
            <p>{t("footprint.emptyDescription")}</p>
            <FootprintMap points={[]} />
          </div>
        )}
      </section>

      {missingEvents.length > 0 ? (
        <section className="footprint-missing-list">
          <div>
            <span className="eyebrow">{t("footprint.missingCoordinates")}</span>
            <h3>{t("footprint.missingTitle")}</h3>
            <p>{t("footprint.missingDescription")}</p>
          </div>
          <div className="footprint-missing-list__items">
            {missingEvents.map((event) => (
              <article key={event.eventId}>
                <strong>{event.title}</strong>
                <span>{formatDate(event.date)}</span>
                <p>
                  {[event.venueName, event.city, event.country].filter(Boolean).join(" · ")}
                </p>
                <small>
                  {event.reason === "invalid" ? t("footprint.invalidCoordinates") : t("footprint.missingCoordinates")}
                </small>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
