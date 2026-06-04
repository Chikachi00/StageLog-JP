import type { EventRecord } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import { paidStatuses, winningStatuses } from "./ticketUtils";

export const countByValue = <T>(items: T[], getValue: (item: T) => string | undefined) =>
  items.reduce<Record<string, number>>((result, item) => {
    const value = getValue(item) || "Unspecified";
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});

export const getAverageTemperature = (events: EventRecord[]) => {
  const temperatures = events
    .map((event) => event.weather?.temperature)
    .filter((value): value is number => typeof value === "number");

  if (temperatures.length === 0) {
    return null;
  }

  const total = temperatures.reduce((sum, value) => sum + value, 0);
  return Math.round((total / temperatures.length) * 10) / 10;
};

export const getTicketApplicationStats = (applications: TicketApplication[]) => {
  const wonCount = applications.filter((application) =>
    winningStatuses.includes(application.status),
  ).length;
  const lostCount = applications.filter((application) => application.status === "lost").length;
  const resolvedCount = wonCount + lostCount;
  const totalPaidAmount = applications
    .filter((application) => paidStatuses.includes(application.status))
    .reduce((sum, application) => sum + (application.price ?? 0) * (application.quantity ?? 1), 0);
  const totalPlannedSpending = applications
    .filter((application) => !["lost", "cancelled"].includes(application.status))
    .reduce((sum, application) => sum + (application.price ?? 0) * (application.quantity ?? 1), 0);
  const pricedApplications = applications.filter((application) => typeof application.price === "number");
  const averageTicketPrice =
    pricedApplications.length > 0
      ? Math.round(
          (pricedApplications.reduce((sum, application) => sum + (application.price ?? 0), 0) /
            pricedApplications.length) *
            10,
        ) / 10
      : null;

  return {
    totalApplications: applications.length,
    wonCount,
    lostCount,
    winRate: resolvedCount > 0 ? Math.round((wonCount / resolvedCount) * 1000) / 10 : null,
    totalPaidAmount,
    totalPlannedSpending,
    averageTicketPrice,
    byPlatform: countByValue(applications, (application) => application.platform),
    byStatus: countByValue(applications, (application) => application.status),
  };
};
