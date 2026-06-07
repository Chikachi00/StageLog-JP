export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));

export const formatDateTime = (date: string, time: string) =>
  `${formatDate(date)}${time ? ` · ${time}` : ""}`;

export const normalizeTimeDisplay = (time?: string) => {
  const value = time?.trim();

  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{1,2}):(\d{2})/);

  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : value;
};

export const formatEventTimeLabel = (
  doorsOpenTime: string | undefined,
  startTime: string | undefined,
  labels: { doors: string; start: string },
) => {
  const doors = normalizeTimeDisplay(doorsOpenTime);
  const start = normalizeTimeDisplay(startTime);

  if (doors && start) {
    return `${labels.doors} ${doors} / ${labels.start} ${start}`;
  }

  if (doors) {
    return `${labels.doors} ${doors}`;
  }

  if (start) {
    return `${labels.start} ${start}`;
  }

  return "";
};

export const getEventYear = (date: string) => date.slice(0, 4);

export const getCurrentYear = () => String(new Date().getFullYear());

export const sortByDateDesc = <T extends { date: string; startTime?: string }>(items: T[]) =>
  [...items].sort((a, b) => {
    const left = `${a.date}T${a.startTime || "00:00"}`;
    const right = `${b.date}T${b.startTime || "00:00"}`;
    return new Date(right).getTime() - new Date(left).getTime();
  });
