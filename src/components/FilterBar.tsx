import { RotateCcw, Search } from "lucide-react";
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
  const updateFilter = (field: keyof EventFilters, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <section className="filter-bar" aria-label="Event filters">
      <label className="search-field">
        <Search size={17} aria-hidden="true" />
        <input
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
          placeholder="Search title, artist, venue..."
        />
      </label>

      <label>
        Year
        <select value={filters.year} onChange={(event) => updateFilter("year", event.target.value)}>
          <option value="all">All years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label>
        Artist
        <select value={filters.artist} onChange={(event) => updateFilter("artist", event.target.value)}>
          <option value="all">All artists</option>
          {artists.map((artist) => (
            <option key={artist} value={artist}>
              {artist}
            </option>
          ))}
        </select>
      </label>

      <label>
        Venue
        <select value={filters.venue} onChange={(event) => updateFilter("venue", event.target.value)}>
          <option value="all">All venues</option>
          {venues.map((venue) => (
            <option key={venue} value={venue}>
              {venue}
            </option>
          ))}
        </select>
      </label>

      <button className="ghost-button" type="button" onClick={onClear}>
        <RotateCcw size={16} aria-hidden="true" />
        Clear filters
      </button>
    </section>
  );
}
