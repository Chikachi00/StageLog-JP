import type { EventRecord } from "../types/event";

export interface LiveCalendarDay {
  date: string;
  dayOfMonth: number;
  month: number;
  weekday: number;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface LiveCalendarMonth {
  month: number;
  firstWeekday: number;
  days: LiveCalendarDay[];
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidEventDate = (date: string | undefined): date is string =>
  Boolean(date && DATE_PATTERN.test(date));

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const getLevel = (count: number): LiveCalendarDay["level"] => {
  if (count <= 0) {
    return 0;
  }

  if (count === 1) {
    return 1;
  }

  if (count === 2) {
    return 2;
  }

  if (count === 3) {
    return 3;
  }

  return 4;
};

export const getLiveCalendarYears = (events: EventRecord[]) =>
  Array.from(
    new Set(
      events
        .map((event) => (isValidEventDate(event.date) ? event.date.slice(0, 4) : ""))
        .filter(Boolean),
    ),
  ).sort((a, b) => b.localeCompare(a));

export const getDefaultLiveCalendarYear = (events: EventRecord[]) =>
  getLiveCalendarYears(events)[0] || String(new Date().getFullYear());

export const getLiveCalendarCounts = (events: EventRecord[], year: string) =>
  events.reduce<Record<string, number>>((counts, event) => {
    if (!isValidEventDate(event.date) || !event.date.startsWith(year)) {
      return counts;
    }

    counts[event.date] = (counts[event.date] || 0) + 1;
    return counts;
  }, {});

export const buildLiveCalendarMonths = (events: EventRecord[], year: string): LiveCalendarMonth[] => {
  const numericYear = Number(year);

  if (!Number.isInteger(numericYear)) {
    return [];
  }

  const counts = getLiveCalendarCounts(events, year);

  return Array.from({ length: 12 }, (_, month) => {
    const daysInMonth = getDaysInMonth(numericYear, month);
    const firstWeekday = new Date(numericYear, month, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const dayOfMonth = index + 1;
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;
      const count = counts[date] || 0;

      return {
        date,
        dayOfMonth,
        month,
        weekday: new Date(numericYear, month, dayOfMonth).getDay(),
        count,
        level: getLevel(count),
      };
    });

    return { month, firstWeekday, days };
  });
};
