import { supabase } from "../lib/supabase";
import type { EventRecord, SeatInfo, WeatherInfo } from "../types/event";

const TABLE_NAME = "events";

interface CloudEventRow {
  id: string;
  user_id: string;
  title: string | null;
  artist: string | null;
  date: string | null;
  doors_open_time: string | null;
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
  image_path: string | null;
  created_at: string | null;
  updated_at: string | null;
}

type CloudJson = SeatInfo | WeatherInfo | Record<string, never>;

type CloudEventPayload = Omit<CloudEventRow, "id" | "seat" | "weather"> & {
  id?: string;
  seat: CloudJson;
  weather: CloudJson;
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string | undefined) => Boolean(value && uuidPattern.test(value));

const cleanOptionalString = (value: string | null | undefined) => {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
};

const cleanRequiredString = (value: string | null | undefined, fieldName: string) => {
  const nextValue = value?.trim();

  if (!nextValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return nextValue;
};

const getSupabaseErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const details = [
      "message" in error && typeof error.message === "string" ? error.message : "",
      "details" in error && typeof error.details === "string" ? error.details : "",
      "hint" in error && typeof error.hint === "string" ? error.hint : "",
      "code" in error && typeof error.code === "string" ? `(${error.code})` : "",
    ].filter(Boolean);

    if (details.length > 0) {
      return details.join(" ");
    }
  }

  return fallback;
};

const throwSupabaseError = (error: unknown, fallback: string): never => {
  throw new Error(getSupabaseErrorMessage(error, fallback));
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

export const toCloudEventRow = (
  event: EventRecord,
  userId: string,
  options: { includeId?: boolean } = {},
): CloudEventPayload => {
  const payload: CloudEventPayload = {
    user_id: userId,
    title: cleanRequiredString(event.title, "title"),
    artist: cleanRequiredString(event.artist, "artist"),
    date: cleanRequiredString(event.date, "date"),
    doors_open_time: cleanOptionalString(event.doorsOpenTime),
    start_time: cleanOptionalString(event.startTime),
    venue_id: cleanRequiredString(event.venueId, "venue_id"),
    venue_name: cleanRequiredString(event.venueName, "venue_name"),
    city: cleanOptionalString(event.city),
    country: cleanOptionalString(event.country),
    ticket_type: cleanOptionalString(event.ticketType),
    seat: event.seat ? normalizeSeat(event.seat) : {},
    weather: event.weather ?? {},
    notes: cleanOptionalString(event.notes),
    image_url:
      !event.imagePath &&
      event.imageUrl &&
      !event.imageUrl.startsWith("data:") &&
      !event.imageUrl.startsWith("blob:")
        ? cleanOptionalString(event.imageUrl)
        : null,
    image_path: cleanOptionalString(event.imagePath),
    created_at: event.createdAt,
    updated_at: event.updatedAt,
  };

  if (options.includeId && isUuid(event.id)) {
    payload.id = event.id;
  }

  return payload;
};

const isWeatherInfo = (weather: unknown): weather is WeatherInfo => {
  if (!weather || typeof weather !== "object") {
    return false;
  }

  const candidate = weather as Partial<WeatherInfo>;
  return (
    typeof candidate.temperature === "number" &&
    typeof candidate.precipitation === "number" &&
    typeof candidate.windSpeed === "number" &&
    typeof candidate.weatherCode === "number" &&
    typeof candidate.fetchedAt === "string"
  );
};

export const fromCloudEventRow = (row: CloudEventRow): EventRecord => {
  const now = new Date().toISOString();

  return {
    id: row.id,
    title: row.title ?? "",
    artist: row.artist ?? "",
    date: row.date ?? "",
    doorsOpenTime: row.doors_open_time ?? "",
    startTime: row.start_time ?? "",
    venueId: row.venue_id ?? "",
    venueName: row.venue_name ?? "",
    city: row.city ?? "",
    country: row.country ?? "",
    ticketType: row.ticket_type ?? "",
    seat: normalizeSeat(row.seat),
    weather: isWeatherInfo(row.weather) ? row.weather : undefined,
    notes: row.notes ?? "",
    imageUrl: row.image_url ?? undefined,
    imagePath: row.image_path ?? undefined,
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
    throwSupabaseError(error, "Failed to load cloud events.");
  }

  return ((data ?? []) as CloudEventRow[]).map(fromCloudEventRow);
}

export async function addCloudEvent(event: EventRecord, userId: string): Promise<EventRecord> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .insert(toCloudEventRow(event, userId, { includeId: false }))
    .select()
    .single();

  if (error) {
    throwSupabaseError(error, "Failed to save event.");
  }

  return fromCloudEventRow(data as CloudEventRow);
}

export async function updateCloudEvent(event: EventRecord, userId: string): Promise<EventRecord> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .update(toCloudEventRow(event, userId, { includeId: false }))
    .eq("id", event.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throwSupabaseError(error, "Failed to save event.");
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
    throwSupabaseError(error, "Failed to delete event.");
  }
}
