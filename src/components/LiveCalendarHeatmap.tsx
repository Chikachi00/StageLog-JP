import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EventRecord } from "../types/event";
import {
  buildLiveCalendarMonths,
  getDefaultLiveCalendarYear,
  getLiveCalendarYears,
} from "../utils/liveCalendarUtils";

interface LiveCalendarHeatmapProps {
  events: EventRecord[];
}

const getMonthLabel = (month: number, language: string) =>
  new Intl.DateTimeFormat(language.startsWith("zh") ? "zh-CN" : "en-US", {
    month: "short",
  }).format(new Date(2024, month, 1));

export function LiveCalendarHeatmap({ events }: LiveCalendarHeatmapProps) {
  const { i18n, t } = useTranslation();
  const yearOptions = useMemo(() => getLiveCalendarYears(events), [events]);
  const [selectedYear, setSelectedYear] = useState(() => getDefaultLiveCalendarYear(events));
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (yearOptions.length === 0) {
      setSelectedYear(String(new Date().getFullYear()));
      return;
    }

    if (!yearOptions.includes(selectedYear)) {
      setSelectedYear(yearOptions[0]);
    }
  }, [selectedYear, yearOptions]);

  const months = useMemo(
    () => buildLiveCalendarMonths(events, selectedYear),
    [events, selectedYear],
  );
  const hasEventDates = months.some((month) => month.days.some((day) => day.count > 0));
  const activeDays = useMemo(
    () => months.reduce((total, month) => total + month.days.filter((day) => day.count > 0).length, 0),
    [months],
  );
  const recordCount = useMemo(
    () => months.reduce((total, month) => total + month.days.reduce((sum, day) => sum + day.count, 0), 0),
    [months],
  );

  return (
    <section className={`live-calendar-card ${isExpanded ? "is-expanded" : "is-collapsed"}`}>
      <div className="live-calendar-header">
        <div>
          <span className="eyebrow">{t("stats.liveCalendarEyebrow")}</span>
          <h2>{t("stats.liveCalendar")}</h2>
          <p>
            {selectedYear} ·{" "}
            {activeDays === 1 ? t("stats.activeDay") : t("stats.activeDays", { count: activeDays })} ·{" "}
            {recordCount === 1 ? t("stats.calendarRecord") : t("stats.calendarRecords", { count: recordCount })}
          </p>
        </div>
        <div className="live-calendar-controls">
          <label className="live-calendar-year-select">
            {t("stats.selectYear")}
            <select
              disabled={yearOptions.length === 0}
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              {yearOptions.length > 0 ? (
                yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))
              ) : (
                <option value={selectedYear}>{selectedYear}</option>
              )}
            </select>
          </label>
          <button
            className="ghost-button live-calendar-toggle"
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
            {isExpanded ? t("stats.collapseCalendar") : t("stats.expandCalendar")}
          </button>
        </div>
      </div>

      {!isExpanded ? null : hasEventDates ? (
        <div className="live-calendar-scroll">
          <div className="live-calendar-grid">
            {months.map((month) => (
              <section className="live-calendar-month" key={month.month}>
                <h3>{getMonthLabel(month.month, i18n.language)}</h3>
                <div className="live-calendar-month-grid">
                  {Array.from({ length: month.firstWeekday }, (_, index) => (
                    <span aria-hidden="true" className="live-calendar-day-spacer" key={`spacer-${index}`} />
                  ))}
                  {month.days.map((day) => {
                    const title =
                      day.count === 1
                        ? `${day.date}: ${t("stats.oneRecordOnDay")}`
                        : day.count > 1
                          ? `${day.date}: ${t("stats.recordsOnDay", { count: day.count })}`
                          : day.date;

                    return (
                      <span
                        aria-label={title}
                        className={`live-calendar-day live-calendar-day--level-${day.level}`}
                        key={day.date}
                        title={title}
                      >
                        {day.dayOfMonth}
                      </span>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="live-calendar-empty">
          <CalendarDays size={24} aria-hidden="true" />
          <p>{t("stats.noEventDatesYet")}</p>
        </div>
      )}
    </section>
  );
}
