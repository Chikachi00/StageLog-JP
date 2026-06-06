import type {
  CurrencyCode,
  TicketApplication,
  TicketApplicationStatus,
  TicketPlatform,
  TicketRoundType,
} from "../types/ticket";

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

export const currencyOptions: CurrencyCode[] = ["CNY", "JPY", "MYR", "USD", "EUR", "GBP", "KRW", "TWD", "HKD", "SGD"];

export const roundTypeOptions: TicketRoundType[] = [
  "fastest",
  "cd_serial",
  "fc",
  "first_lottery",
  "second_lottery",
  "general",
  "reserved_seat_extra",
  "standing",
  "official_resale",
  "upgrade",
  "other",
];

export const winningStatuses: TicketApplicationStatus[] = ["won", "paid", "issued", "attended"];

export const paidStatuses: TicketApplicationStatus[] = ["paid", "issued", "attended"];

export const resolvedStatuses: TicketApplicationStatus[] = [
  "won",
  "lost",
  "paid",
  "issued",
  "attended",
  "cancelled",
];

const normalizeKeyPart = (value?: string) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, "")
    .replace(/\s+/g, " ") || "";

export const normalizeTicketGroupKey = (application: {
  artist?: string;
  eventTitle?: string;
  eventDate?: string;
  venueId?: string;
  venueName?: string;
}) => {
  const artist = normalizeKeyPart(application.artist) || "unknown-artist";
  const eventTitle = normalizeKeyPart(application.eventTitle) || "unknown-event";
  const eventDate = application.eventDate?.trim() || "unknown-date";
  const venue = application.venueId?.trim() || normalizeKeyPart(application.venueName) || "unknown-venue";

  return `${artist}__${eventTitle}__${eventDate}__${venue}`;
};

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

export const getAppliedQuantity = (application: TicketApplication) =>
  application.appliedQuantity ?? application.quantity ?? 1;

export const getWonQuantity = (application: TicketApplication) => {
  if (typeof application.wonQuantity === "number") {
    return application.wonQuantity;
  }

  if (application.status === "lost" || application.status === "cancelled") {
    return 0;
  }

  if (winningStatuses.includes(application.status)) {
    return application.quantity ?? 1;
  }

  return 0;
};

export const getPaidQuantity = (application: TicketApplication) => {
  if (typeof application.paidQuantity === "number") {
    return application.paidQuantity;
  }

  return paidStatuses.includes(application.status) ? getWonQuantity(application) : 0;
};

export const getTicketDisplayCurrency = (application: TicketApplication): CurrencyCode =>
  application.displayCurrency ?? "CNY";

export const getTicketOriginalCurrency = (application: TicketApplication): CurrencyCode =>
  application.currency ?? "CNY";

export const getTicketAmountOriginal = (application: TicketApplication) => {
  if (typeof application.amountOriginal === "number") {
    return application.amountOriginal;
  }

  if (typeof application.unitPriceOriginal === "number") {
    const quantity = getPaidQuantity(application) || getWonQuantity(application) || application.quantity || 1;
    return application.unitPriceOriginal * quantity;
  }

  if (typeof application.price === "number") {
    const quantity = getPaidQuantity(application) || getWonQuantity(application) || application.quantity || 1;
    return application.price * quantity;
  }

  return undefined;
};

export const getTicketAmountDisplay = (application: TicketApplication) => {
  if (typeof application.amountDisplay === "number") {
    return application.amountDisplay;
  }

  const amountOriginal = getTicketAmountOriginal(application);

  if (typeof amountOriginal !== "number") {
    return undefined;
  }

  if (getTicketOriginalCurrency(application) === getTicketDisplayCurrency(application)) {
    return amountOriginal;
  }

  if (typeof application.exchangeRateToDisplay === "number") {
    return Math.round(amountOriginal * application.exchangeRateToDisplay * 100) / 100;
  }

  return undefined;
};

export const formatCurrencyAmount = (value: number, currency: CurrencyCode = "CNY") =>
  `${Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;

export const formatCurrency = formatCurrencyAmount;

export const formatTicketPrice = (application: TicketApplication) => {
  const amountDisplay = getTicketAmountDisplay(application);

  if (typeof amountDisplay === "number") {
    return formatCurrencyAmount(amountDisplay, getTicketDisplayCurrency(application));
  }

  if (typeof application.price !== "number") {
    return "Price not set";
  }

  return formatCurrencyAmount(getTicketTotal(application), getTicketOriginalCurrency(application));
};
