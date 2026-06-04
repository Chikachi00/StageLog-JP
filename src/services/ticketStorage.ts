import type { TicketApplication } from "../types/ticket";

export const TICKET_APPLICATIONS_STORAGE_KEY = "stagelog-ticket-applications";

const isBrowser = () => typeof window !== "undefined" && Boolean(window.localStorage);

const normalizeApplication = (application: Partial<TicketApplication>): TicketApplication => {
  const now = new Date().toISOString();

  return {
    id: application.id ?? crypto.randomUUID(),
    eventTitle: application.eventTitle ?? "",
    artist: application.artist ?? "",
    venueId: application.venueId,
    venueName: application.venueName,
    city: application.city,
    country: application.country,
    eventDate: application.eventDate,
    platform: application.platform ?? "other",
    applicationDate: application.applicationDate,
    resultDate: application.resultDate,
    paymentDeadline: application.paymentDeadline,
    issueDate: application.issueDate,
    status: application.status ?? "planned",
    ticketType: application.ticketType,
    price: typeof application.price === "number" ? application.price : undefined,
    quantity: typeof application.quantity === "number" ? application.quantity : undefined,
    companionName: application.companionName,
    companionContact: application.companionContact,
    memo: application.memo,
    linkedEventId: application.linkedEventId,
    createdAt: application.createdAt ?? now,
    updatedAt: application.updatedAt ?? application.createdAt ?? now,
  };
};

export function getTicketApplications(): TicketApplication[] {
  if (!isBrowser()) {
    return [];
  }

  const raw = window.localStorage.getItem(TICKET_APPLICATIONS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((application) => normalizeApplication(application as Partial<TicketApplication>))
      : [];
  } catch {
    return [];
  }
}

export function saveTicketApplications(applications: TicketApplication[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(TICKET_APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
}

export function addTicketApplication(application: TicketApplication) {
  const applications = [application, ...getTicketApplications()];
  saveTicketApplications(applications);
  return application;
}

export function updateTicketApplication(application: TicketApplication) {
  const applications = getTicketApplications().map((item) =>
    item.id === application.id ? application : item,
  );
  saveTicketApplications(applications);
  return application;
}

export function deleteTicketApplication(id: string) {
  const applications = getTicketApplications().filter((application) => application.id !== id);
  saveTicketApplications(applications);
}
