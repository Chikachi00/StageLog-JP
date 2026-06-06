import type { EventRecord } from "../types/event";
import type { TicketApplication } from "../types/ticket";
import {
  getAppliedQuantity,
  getPaidQuantity,
  getPerformanceSuccessRate,
  getQuantityWinRate,
  getRoundWinRate,
  getTicketAmountDisplay,
  getTicketDisplayAmountForStats,
  getTicketDisplayCurrency,
  getWonQuantity,
  groupTicketApplications,
  isResolvedTicketRound,
  isWonTicketRound,
  paidStatuses,
} from "./ticketUtils";

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
  const wonCount = applications.filter(isWonTicketRound).length;
  const lostCount = applications.filter((application) => application.status === "lost").length;
  const resolvedCount = applications.filter(isResolvedTicketRound).length;
  const totalAppliedQuantity = applications.reduce((sum, application) => sum + getAppliedQuantity(application), 0);
  const totalWonQuantity = applications.reduce((sum, application) => sum + getWonQuantity(application), 0);
  const totalPaidQuantity = applications.reduce((sum, application) => sum + getPaidQuantity(application), 0);
  const displayCurrency = applications[0] ? getTicketDisplayCurrency(applications[0]) : "CNY";
  const totalPaidAmount = applications
    .filter((application) => paidStatuses.includes(application.status))
    .reduce((sum, application) => {
      const amount = getTicketDisplayAmountForStats(application);
      return amount !== undefined && getTicketDisplayCurrency(application) === displayCurrency ? sum + amount : sum;
    }, 0);
  const totalPlannedSpending = applications
    .filter((application) => !["lost", "cancelled"].includes(application.status))
    .reduce((sum, application) => {
      const amount = getTicketDisplayAmountForStats(application);
      return amount !== undefined && getTicketDisplayCurrency(application) === displayCurrency ? sum + amount : sum;
    }, 0);
  const pricedApplications = applications.filter((application) => typeof getTicketAmountDisplay(application) === "number");
  const averageTicketPrice =
    pricedApplications.length > 0
      ? Math.round(
          (pricedApplications.reduce((sum, application) => sum + (getTicketAmountDisplay(application) ?? 0), 0) /
            pricedApplications.length) *
            10,
        ) / 10
      : null;

  return {
    totalApplications: applications.length,
    totalAppliedQuantity,
    totalWonQuantity,
    totalPaidQuantity,
    wonCount,
    lostCount,
    resolvedCount,
    winRate: resolvedCount > 0 ? Math.round((wonCount / resolvedCount) * 1000) / 10 : null,
    quantityWinRate: getQuantityWinRate(applications),
    roundWinRate: getRoundWinRate(applications),
    performanceSuccessRate: getPerformanceSuccessRate(applications),
    totalPaidAmount,
    totalPlannedSpending,
    averageTicketPrice,
    displayCurrency,
    ticketGroups: groupTicketApplications(applications),
    byPlatform: countByValue(applications, (application) => application.platform),
    byStatus: countByValue(applications, (application) => application.status),
  };
};
