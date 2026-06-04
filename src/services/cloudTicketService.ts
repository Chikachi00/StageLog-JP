import { supabase } from "../lib/supabase";
import type { TicketApplication, TicketApplicationStatus, TicketPlatform } from "../types/ticket";

const TABLE_NAME = "ticket_applications";

interface CloudTicketApplicationRow {
  id: string;
  user_id: string;
  event_title: string | null;
  artist: string | null;
  venue_id: string | null;
  venue_name: string | null;
  city: string | null;
  country: string | null;
  event_date: string | null;
  platform: string | null;
  application_date: string | null;
  result_date: string | null;
  payment_deadline: string | null;
  issue_date: string | null;
  status: string | null;
  ticket_type: string | null;
  price: number | string | null;
  quantity: number | null;
  companion_name: string | null;
  companion_contact: string | null;
  memo: string | null;
  linked_event_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
};

const normalizePlatform = (platform: string | null | undefined): TicketPlatform => {
  const options: TicketPlatform[] = ["eplus", "pia", "lawson", "ticketboard", "rakuten", "other"];
  return options.includes(platform as TicketPlatform) ? (platform as TicketPlatform) : "other";
};

const normalizeStatus = (status: string | null | undefined): TicketApplicationStatus => {
  const options: TicketApplicationStatus[] = [
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
  return options.includes(status as TicketApplicationStatus)
    ? (status as TicketApplicationStatus)
    : "planned";
};

export const toCloudTicketApplicationRow = (
  application: TicketApplication,
  userId: string,
): CloudTicketApplicationRow => ({
  id: application.id,
  user_id: userId,
  event_title: application.eventTitle,
  artist: application.artist,
  venue_id: application.venueId ?? null,
  venue_name: application.venueName ?? null,
  city: application.city ?? null,
  country: application.country ?? null,
  event_date: application.eventDate ?? null,
  platform: application.platform,
  application_date: application.applicationDate ?? null,
  result_date: application.resultDate ?? null,
  payment_deadline: application.paymentDeadline ?? null,
  issue_date: application.issueDate ?? null,
  status: application.status,
  ticket_type: application.ticketType ?? null,
  price: application.price ?? null,
  quantity: application.quantity ?? null,
  companion_name: application.companionName ?? null,
  companion_contact: application.companionContact ?? null,
  memo: application.memo ?? null,
  linked_event_id: application.linkedEventId ?? null,
  created_at: application.createdAt,
  updated_at: application.updatedAt,
});

export const fromCloudTicketApplicationRow = (row: CloudTicketApplicationRow): TicketApplication => {
  const now = new Date().toISOString();
  const price = typeof row.price === "string" ? Number(row.price) : row.price;

  return {
    id: row.id,
    eventTitle: row.event_title ?? "",
    artist: row.artist ?? "",
    venueId: row.venue_id ?? undefined,
    venueName: row.venue_name ?? undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    eventDate: row.event_date ?? undefined,
    platform: normalizePlatform(row.platform),
    applicationDate: row.application_date ?? undefined,
    resultDate: row.result_date ?? undefined,
    paymentDeadline: row.payment_deadline ?? undefined,
    issueDate: row.issue_date ?? undefined,
    status: normalizeStatus(row.status),
    ticketType: row.ticket_type ?? undefined,
    price: typeof price === "number" && Number.isFinite(price) ? price : undefined,
    quantity: typeof row.quantity === "number" ? row.quantity : undefined,
    companionName: row.companion_name ?? undefined,
    companionContact: row.companion_contact ?? undefined,
    memo: row.memo ?? undefined,
    linkedEventId: row.linked_event_id ?? undefined,
    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? row.created_at ?? now,
  };
};

export async function getCloudTicketApplications(userId: string): Promise<TicketApplication[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("*")
    .eq("user_id", userId)
    .order("event_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CloudTicketApplicationRow[]).map(fromCloudTicketApplicationRow);
}

export async function addCloudTicketApplication(
  application: TicketApplication,
  userId: string,
): Promise<TicketApplication> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .insert(toCloudTicketApplicationRow(application, userId))
    .select()
    .single();

  if (error) {
    throw error;
  }

  return fromCloudTicketApplicationRow(data as CloudTicketApplicationRow);
}

export async function updateCloudTicketApplication(
  application: TicketApplication,
  userId: string,
): Promise<TicketApplication> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .update(toCloudTicketApplicationRow(application, userId))
    .eq("id", application.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return fromCloudTicketApplicationRow(data as CloudTicketApplicationRow);
}

export async function deleteCloudTicketApplication(id: string, userId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from(TABLE_NAME)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
