export type TicketPlatform =
  | "eplus"
  | "pia"
  | "lawson"
  | "ticketboard"
  | "rakuten"
  | "other";

export type CurrencyCode = "CNY" | "JPY" | "MYR" | "USD" | "EUR" | "GBP" | "KRW" | "TWD" | "HKD" | "SGD";

export type TicketRoundType =
  | "fastest"
  | "cd_serial"
  | "fc"
  | "first_lottery"
  | "second_lottery"
  | "general"
  | "reserved_seat_extra"
  | "standing"
  | "official_resale"
  | "upgrade"
  | "other";

export type TicketApplicationStatus =
  | "planned"
  | "applied"
  | "waiting_result"
  | "won"
  | "lost"
  | "paid"
  | "issued"
  | "attended"
  | "cancelled";

export interface TicketApplication {
  id: string;
  eventTitle: string;
  artist: string;
  venueId?: string;
  venueName?: string;
  city?: string;
  country?: string;
  eventDate?: string;
  platform: TicketPlatform;
  applicationDate?: string;
  resultDate?: string;
  paymentDeadline?: string;
  issueDate?: string;
  status: TicketApplicationStatus;
  ticketType?: string;
  price?: number;
  quantity?: number;
  companionName?: string;
  companionContact?: string;
  memo?: string;
  linkedEventId?: string;
  ticketGroupKey?: string;
  roundName?: string;
  roundType?: TicketRoundType;
  appliedQuantity?: number;
  wonQuantity?: number;
  paidQuantity?: number;
  currency?: CurrencyCode;
  displayCurrency?: CurrencyCode;
  amountOriginal?: number;
  exchangeRateToDisplay?: number;
  amountDisplay?: number;
  unitPriceOriginal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketApplicationFormValues {
  eventTitle: string;
  artist: string;
  venueId: string;
  eventDate: string;
  platform: TicketPlatform;
  applicationDate: string;
  resultDate: string;
  paymentDeadline: string;
  issueDate: string;
  status: TicketApplicationStatus;
  roundName: string;
  roundType: TicketRoundType;
  ticketType: string;
  price: string;
  quantity: string;
  appliedQuantity: string;
  wonQuantity: string;
  paidQuantity: string;
  currency: CurrencyCode;
  displayCurrency: CurrencyCode;
  amountOriginal: string;
  exchangeRateToDisplay: string;
  amountDisplay: string;
  unitPriceOriginal: string;
  companionName: string;
  companionContact: string;
  memo: string;
}

export interface TicketApplicationFilters {
  status: TicketApplicationStatus | "all";
  platform: TicketPlatform | "all";
  search: string;
}
