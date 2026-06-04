import { RotateCcw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventFilters } from "../types/event";

interface FilterBarProps {
  filters: EventFilters;
  years: string[];
  artists: string[];
  venues: string[];
  onChange: (filters: EventFilters) => void;
  onClear: () => void;
}

export function FilterBar({ filters, years, artists, venues, onChange, onClear }: FilterBarProps) {
  const { t } = useTranslation();
  const updateFilter = (field: keyof EventFilters, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <section className="filter-bar" aria-label={t("filters.aria")}>
      <label className="search-field">
        <Search size={17} aria-hidden="true" />
        <input
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
          placeholder={t("filters.searchPlaceholder")}
        />
      </label>

      <label>
        {t("filters.year")}
        <select value={filters.year} onChange={(event) => updateFilter("year", event.target.value)}>
          <option value="all">{t("filters.allYears")}</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t("filters.artist")}
        <select value={filters.artist} onChange={(event) => updateFilter("artist", event.target.value)}>
          <option value="all">{t("filters.allArtists")}</option>
          {artists.map((artist) => (
            <option key={artist} value={artist}>
              {artist}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t("filters.venue")}
        <select value={filters.venue} onChange={(event) => updateFilter("venue", event.target.value)}>
          <option value="all">{t("filters.allVenues")}</option>
          {venues.map((venue) => (
            <option key={venue} value={venue}>
              {venue}
            </option>
          ))}
        </select>
      </label>

      <button className="ghost-button" type="button" onClick={onClear}>
        <RotateCcw size={16} aria-hidden="true" />
        {t("filters.clear")}
      </button>
    </section>
  );
}
