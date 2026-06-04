import type { TicketApplication, TicketApplicationStatus, TicketPlatform } from "../types/ticket";

export const platformLabels: Record<TicketPlatform, string> = {
  eplus: "e+",
  pia: "Pia",
  lawson: "Lawson",
  ticketboard: "Ticket Board",
  rakuten: "Rakuten",
  other: "Other",
};

export const statusLabels: Record<TicketApplicationStatus, string> = {
  planned: "Planned",
  applied: "Applied",
  waiting_result: "Waiting Result",
  won: "Won",
  lost: "Lost",
  paid: "Paid",
  issued: "Issued",
  attended: "Attended",
  cancelled: "Cancelled",
};

export const statusOptions: TicketApplicationStatus[] = [
  "planned",
  "applied",
  "waiting_result",
  "won",
  "lost",
  "paid",
  "issued",
  "attended",
  "cancelled",
];

export const platformOptions: TicketPlatform[] = [
  "eplus",
  "pia",
  "lawson",
  "ticketboard",
  "rakuten",
  "other",
];

export const winningStatuses: TicketApplicationStatus[] = ["won", "paid", "issued", "attended"];

export const paidStatuses: TicketApplicationStatus[] = ["paid", "issued", "attended"];

export const canCreateEventRecord = (application: TicketApplication) =>
  winningStatuses.includes(application.status);

export const isPaymentOverdue = (application: TicketApplication) => {
  if (application.status !== "won" || !application.paymentDeadline) {
    return false;
  }

  const today = new Date().toISOString().slice(0, 10);
  return application.paymentDeadline < today;
};

export const getTicketTotal = (application: TicketApplication) =>
  (application.price ?? 0) * (application.quantity ?? 1);

export const formatTicketPrice = (application: TicketApplication) => {
  if (typeof application.price !== "number") {
    return "Price not set";
  }

  return `${getTicketTotal(application).toLocaleString()} JPY`;
};
