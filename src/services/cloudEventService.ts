import { supabase } from "../lib/supabase";
import type { EventRecord, SeatInfo, WeatherInfo } from "../types/event";

const TABLE_NAME = "events";

interface CloudEventRow {
  id: string;
  user_id: string;
  title: string | null;
  artist: string | null;
  date: string | null;
  start_time: string | null;
  venue_id: string | null;
  venue_name: string | null;
  city: string | null;
  country: string | null;
  ticket_type: string | null;
  seat: SeatInfo | null;
  weather: WeatherInfo | null;
  notes: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
};

const normalizeSeat = (seat: SeatInfo | null | undefined): SeatInfo => ({
  gate: seat?.gate ?? "",
  level: seat?.level ?? "",
  block: seat?.block ?? "",
  row: seat?.row ?? "",
  number: seat?.number ?? "",
  sectionId: seat?.sectionId,
  sectionLabel: seat?.sectionLabel,
  x: typeof seat?.x === "number" ? seat.x : undefined,
  y: typeof seat?.y === "number" ? seat.y : undefined,
});

export const toCloudEventRow = (event: EventRecord, userId: string): CloudEventRow => ({
  id: event.id,
  user_id: userId,
  title: event.title,
  artist: event.artist,
  date: event.date,
  start_time: event.startTime,
  venue_id: event.venueId,
  venue_name: event.venueName,
  city: event.city,
  country: event.country,
  ticket_type: event.ticketType,
  seat: normalizeSeat(event.seat),
  weather: event.weather ?? null,
  notes: event.notes,
  image_url: event.imageUrl ?? null,
  created_at: event.createdAt,
  updated_at: event.updatedAt,
});

export const fromCloudEventRow = (row: CloudEventRow): EventRecord => {
  const now = new Date().toISOString();

  return {
    id: row.id,
    title: row.title ?? "",
    artist: row.artist ?? "",
    date: row.date ?? "",
    startTime: row.start_time ?? "",
    venueId: row.venue_id ?? "",
    venueName: row.venue_name ?? "",
    city: row.city ?? "",
    country: row.country ?? "",
    ticketType: row.ticket_type ?? "",
    seat: normalizeSeat(row.seat),
    weather: row.weather ?? undefined,
    notes: row.notes ?? "",
    imageUrl: row.image_url ?? undefined,
    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? row.created_at ?? now,
  };
};

export async function getCloudEvents(userId: string): Promise<EventRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CloudEventRow[]).map(fromCloudEventRow);
}

export async function addCloudEvent(event: EventRecord, userId: string): Promise<EventRecord> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .insert(toCloudEventRow(event, userId))
    .select()
    .single();

  if (error) {
    throw error;
  }

  return fromCloudEventRow(data as CloudEventRow);
}

export async function updateCloudEvent(event: EventRecord, userId: string): Promise<EventRecord> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .update(toCloudEventRow(event, userId))
    .eq("id", event.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return fromCloudEventRow(data as CloudEventRow);
}

export async function deleteCloudEvent(id: string, userId: string): Promise<void> {
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
