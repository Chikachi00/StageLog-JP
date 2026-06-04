export type TicketPlatform =
  | "eplus"
  | "pia"
  | "lawson"
  | "ticketboard"
  | "rakuten"
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
  ticketType: string;
  price: string;
  quantity: string;
  companionName: string;
  companionContact: string;
  memo: string;
}

export interface TicketApplicationFilters {
  status: TicketApplicationStatus | "all";
  platform: TicketPlatform | "all";
  search: string;
}
