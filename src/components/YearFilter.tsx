interface YearFilterProps {
  years: number[];
  selectedYear: number | "all";
  onChange: (year: number | "all") => void;
}

export function YearFilter({ years, selectedYear, onChange }: YearFilterProps) {
  return (
    <div className="year-filter" aria-label="Filter events by year">
      <button
        className={selectedYear === "all" ? "is-active" : undefined}
        type="button"
        onClick={() => onChange("all")}
      >
        All
      </button>
      {years.map((year) => (
        <button
          className={selectedYear === year ? "is-active" : undefined}
          key={year}
          type="button"
          onClick={() => onChange(year)}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
