import { supabase } from "../lib/supabase";
import type { UserProfile } from "../types/profile";
import { isAppTheme } from "../types/theme";

const TABLE_NAME = "profiles";

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  home_region: string | null;
  language: string | null;
  theme: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

type ProfileUpdateRow = Partial<Omit<ProfileRow, "id" | "created_at">> & {
  updated_at: string;
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
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

const normalizeLanguage = (language: string | null | undefined): UserProfile["language"] =>
  language === "zh" ? "zh" : "en";

const fromProfileRow = (row: ProfileRow): UserProfile => ({
  id: row.id,
  email: row.email ?? undefined,
  displayName: row.display_name ?? undefined,
  username: row.username ?? undefined,
  homeRegion: row.home_region ?? undefined,
  language: normalizeLanguage(row.language),
  theme: isAppTheme(row.theme) ? row.theme : "sakura",
  avatarUrl: row.avatar_url ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
});

const toProfileRow = (profile: UserProfile): ProfileRow => {
  const now = new Date().toISOString();

  return {
    id: profile.id,
    email: profile.email ?? null,
    display_name: profile.displayName ?? null,
    username: profile.username ?? null,
    home_region: profile.homeRegion ?? null,
    language: profile.language,
    theme: profile.theme,
    avatar_url: profile.avatarUrl ?? null,
    created_at: profile.createdAt ?? now,
    updated_at: now,
  };
};

const toProfileUpdateRow = (
  updates: Partial<Omit<UserProfile, "id" | "createdAt">>,
): ProfileUpdateRow => {
  const row: ProfileUpdateRow = {
    updated_at: new Date().toISOString(),
  };

  if ("email" in updates) {
    row.email = updates.email ?? null;
  }

  if ("displayName" in updates) {
    row.display_name = updates.displayName ?? null;
  }

  if ("username" in updates) {
    row.username = updates.username ?? null;
  }

  if ("homeRegion" in updates) {
    row.home_region = updates.homeRegion ?? null;
  }

  if ("language" in updates) {
    row.language = updates.language ?? null;
  }

  if ("theme" in updates) {
    row.theme = updates.theme ?? null;
  }

  if ("avatarUrl" in updates) {
    row.avatar_url = updates.avatarUrl ?? null;
  }

  return row;
};

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throwSupabaseError(error, "Failed to load profile.");
  }

  return data ? fromProfileRow(data as ProfileRow) : null;
}

export async function upsertProfile(profile: UserProfile): Promise<UserProfile> {
  const client = requireSupabase();
  const profileRow = toProfileRow(profile);
  const { data, error } = await client
    .from(TABLE_NAME)
    .upsert(profileRow, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    throwSupabaseError(error, "Failed to save profile.");
  }

  return fromProfileRow(data as ProfileRow);
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "createdAt">>,
): Promise<UserProfile> {
  const client = requireSupabase();
  const rowUpdates = toProfileUpdateRow(updates);

  const { data, error } = await client
    .from(TABLE_NAME)
    .update(rowUpdates)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) {
    throwSupabaseError(error, "Failed to save profile.");
  }

  if (!data) {
    return upsertProfile({
      id: userId,
      email: updates.email,
      displayName: updates.displayName,
      username: updates.username,
      homeRegion: updates.homeRegion,
      language: updates.language ?? "en",
      theme: updates.theme ?? "sakura",
      avatarUrl: updates.avatarUrl,
    });
  }

  return fromProfileRow(data as ProfileRow);
}
