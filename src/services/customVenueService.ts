import { supabase } from "../lib/supabase";
import type { CustomVenue, CustomVenueCategory } from "../types/venue";

export const CUSTOM_VENUES_STORAGE_KEY = "stagelog-custom-venues";

type NumberInput = number | string | null | undefined;

export type CustomVenueInput = Omit<
  Partial<CustomVenue>,
  "createdAt" | "updatedAt" | "latitude" | "longitude" | "capacity"
> & {
  name: string;
  latitude?: NumberInput;
  longitude?: NumberInput;
  capacity?: NumberInput;
};

export type CustomVenueUpdate = Omit<
  Partial<CustomVenue>,
  "id" | "userId" | "createdAt" | "updatedAt" | "latitude" | "longitude" | "capacity"
> & {
  latitude?: NumberInput;
  longitude?: NumberInput;
  capacity?: NumberInput;
};

interface SupabaseCustomVenueRow {
  id: string;
  user_id: string;
  name: string;
  name_ja: string | null;
  name_zh: string | null;
  aliases: string[] | null;
  city: string | null;
  country: string | null;
  prefecture: string | null;
  region: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  category: string | null;
  capacity: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

type SupabaseCustomVenuePayload = Partial<{
  id: string;
  user_id: string;
  name: string;
  name_ja: string | null;
  name_zh: string | null;
  aliases: string[];
  city: string;
  country: string;
  prefecture: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  category: CustomVenueCategory | null;
  capacity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}>;

const customVenueCategories: CustomVenueCategory[] = [
  "dome",
  "arena",
  "hall",
  "livehouse",
  "convention",
  "stadium",
  "theater",
  "other",
];

const isBrowser = () => typeof window !== "undefined" && Boolean(window.localStorage);

const createCustomVenueId = () => {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `custom:${uuid}`;
};

const cleanRequiredString = (value: string | undefined, fallback: string) => value?.trim() || fallback;

const cleanOptionalString = (value: string | null | undefined) => {
  const text = value?.trim();
  return text ? text : undefined;
};

const cleanOptionalArray = (value: string[] | undefined) => {
  const aliases = (value ?? []).map((item) => item.trim()).filter(Boolean);
  return aliases.length > 0 ? aliases : undefined;
};

const cleanOptionalNumber = (value: NumberInput) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : undefined;
};

const normalizeCategory = (value: string | null | undefined): CustomVenueCategory | undefined =>
  customVenueCategories.includes(value as CustomVenueCategory) ? (value as CustomVenueCategory) : undefined;

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

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
};

const shouldUseCloud = (userId?: string) => Boolean(userId && supabase);

export const normalizeCustomVenue = (input: CustomVenueInput | Partial<CustomVenue>): CustomVenue => {
  const now = new Date().toISOString();
  const id = input.id?.trim() || createCustomVenueId();
  const createdAt = "createdAt" in input ? input.createdAt : undefined;
  const updatedAt = "updatedAt" in input ? input.updatedAt : undefined;

  return {
    id,
    userId: cleanOptionalString(input.userId),
    name: cleanRequiredString(input.name, "Custom venue"),
    nameJa: cleanOptionalString(input.nameJa),
    nameZh: cleanOptionalString(input.nameZh),
    aliases: cleanOptionalArray(input.aliases),
    city: cleanRequiredString(input.city, "Unknown"),
    country: cleanRequiredString(input.country, "Japan"),
    prefecture: cleanOptionalString(input.prefecture),
    region: cleanOptionalString(input.region),
    latitude: cleanOptionalNumber(input.latitude),
    longitude: cleanOptionalNumber(input.longitude),
    category: normalizeCategory(input.category),
    capacity: cleanOptionalNumber(input.capacity),
    notes: cleanOptionalString(input.notes),
    createdAt: createdAt ?? now,
    updatedAt: updatedAt ?? createdAt ?? now,
  };
};

export const mapSupabaseCustomVenue = (row: SupabaseCustomVenueRow): CustomVenue =>
  normalizeCustomVenue({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    nameJa: row.name_ja ?? undefined,
    nameZh: row.name_zh ?? undefined,
    aliases: Array.isArray(row.aliases) ? row.aliases : undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    prefecture: row.prefecture ?? undefined,
    region: row.region ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    category: normalizeCategory(row.category),
    capacity: row.capacity,
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  });

export const toSupabaseCustomVenuePayload = (
  venue: Partial<CustomVenueInput | CustomVenueUpdate | CustomVenue>,
  userId?: string,
): SupabaseCustomVenuePayload => {
  const payload: SupabaseCustomVenuePayload = {};

  if ("id" in venue && venue.id) payload.id = venue.id;
  if (userId) payload.user_id = userId;
  if ("name" in venue && venue.name !== undefined) payload.name = cleanRequiredString(venue.name, "Custom venue");
  if ("nameJa" in venue) payload.name_ja = cleanOptionalString(venue.nameJa) ?? null;
  if ("nameZh" in venue) payload.name_zh = cleanOptionalString(venue.nameZh) ?? null;
  if ("aliases" in venue) payload.aliases = cleanOptionalArray(venue.aliases) ?? [];
  if ("city" in venue && venue.city !== undefined) payload.city = cleanRequiredString(venue.city, "Unknown");
  if ("country" in venue && venue.country !== undefined) payload.country = cleanRequiredString(venue.country, "Japan");
  if ("prefecture" in venue) payload.prefecture = cleanOptionalString(venue.prefecture) ?? null;
  if ("region" in venue) payload.region = cleanOptionalString(venue.region) ?? null;
  if ("latitude" in venue) payload.latitude = cleanOptionalNumber(venue.latitude) ?? null;
  if ("longitude" in venue) payload.longitude = cleanOptionalNumber(venue.longitude) ?? null;
  if ("category" in venue) payload.category = normalizeCategory(venue.category) ?? null;
  if ("capacity" in venue) payload.capacity = cleanOptionalNumber(venue.capacity) ?? null;
  if ("notes" in venue) payload.notes = cleanOptionalString(venue.notes) ?? null;
  if ("createdAt" in venue && venue.createdAt) payload.created_at = venue.createdAt;
  if ("updatedAt" in venue && venue.updatedAt) payload.updated_at = venue.updatedAt;

  return payload;
};

const sortCustomVenues = (venues: CustomVenue[]) =>
  [...venues].sort(
    (first, second) =>
      second.updatedAt.localeCompare(first.updatedAt) || first.name.localeCompare(second.name),
  );

export function getLocalCustomVenues(): CustomVenue[] {
  if (!isBrowser()) {
    return [];
  }

  const raw = window.localStorage.getItem(CUSTOM_VENUES_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sortCustomVenues(parsed.map((venue) => normalizeCustomVenue(venue))) : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomVenues(venues: CustomVenue[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(CUSTOM_VENUES_STORAGE_KEY, JSON.stringify(sortCustomVenues(venues)));
}

export async function listCustomVenues(userId?: string): Promise<CustomVenue[]> {
  if (!shouldUseCloud(userId)) {
    return getLocalCustomVenues();
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("custom_venues")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throwSupabaseError(error, "Failed to load custom venues.");
  }

  return ((data ?? []) as SupabaseCustomVenueRow[]).map(mapSupabaseCustomVenue);
}

export async function createCustomVenue(input: CustomVenueInput, userId?: string): Promise<CustomVenue> {
  const venue = normalizeCustomVenue({
    ...input,
    userId,
    id: input.id || createCustomVenueId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (!shouldUseCloud(userId)) {
    saveLocalCustomVenues([venue, ...getLocalCustomVenues().filter((item) => item.id !== venue.id)]);
    return venue;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("custom_venues")
    .insert(toSupabaseCustomVenuePayload(venue, userId))
    .select()
    .single();

  if (error) {
    throwSupabaseError(error, "Failed to save custom venue.");
  }

  return mapSupabaseCustomVenue(data as SupabaseCustomVenueRow);
}

export async function updateCustomVenue(
  id: string,
  updates: CustomVenueUpdate,
  userId?: string,
): Promise<CustomVenue> {
  const updatedAt = new Date().toISOString();

  if (!shouldUseCloud(userId)) {
    const venues = getLocalCustomVenues();
    const currentVenue = venues.find((venue) => venue.id === id);

    if (!currentVenue) {
      throw new Error("Custom venue not found.");
    }

    const updatedVenue = normalizeCustomVenue({
      ...currentVenue,
      ...updates,
      id,
      userId: currentVenue.userId,
      createdAt: currentVenue.createdAt,
      updatedAt,
    });

    saveLocalCustomVenues(venues.map((venue) => (venue.id === id ? updatedVenue : venue)));
    return updatedVenue;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("custom_venues")
    .update(toSupabaseCustomVenuePayload({ ...updates, updatedAt }, userId))
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throwSupabaseError(error, "Failed to save custom venue.");
  }

  return mapSupabaseCustomVenue(data as SupabaseCustomVenueRow);
}

export async function deleteCustomVenue(id: string, userId?: string): Promise<void> {
  if (!shouldUseCloud(userId)) {
    saveLocalCustomVenues(getLocalCustomVenues().filter((venue) => venue.id !== id));
    return;
  }

  const client = requireSupabase();
  const { error } = await client
    .from("custom_venues")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throwSupabaseError(error, "Failed to delete custom venue.");
  }
}
