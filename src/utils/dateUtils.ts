export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));

export const formatDateTime = (date: string, time: string) =>
  `${formatDate(date)}${time ? ` · ${time}` : ""}`;

export const getEventYear = (date: string) => date.slice(0, 4);

export const getCurrentYear = () => String(new Date().getFullYear());

export const sortByDateDesc = <T extends { date: string; startTime?: string }>(items: T[]) =>
  [...items].sort((a, b) => {
    const left = `${a.date}T${a.startTime || "00:00"}`;
    const right = `${b.date}T${b.startTime || "00:00"}`;
    return new Date(right).getTime() - new Date(left).getTime();
  });
