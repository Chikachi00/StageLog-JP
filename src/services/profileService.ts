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

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
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

const toProfileRow = (profile: UserProfile): ProfileRow => ({
  id: profile.id,
  email: profile.email ?? null,
  display_name: profile.displayName ?? null,
  username: profile.username ?? null,
  home_region: profile.homeRegion ?? null,
  language: profile.language,
  theme: profile.theme,
  avatar_url: profile.avatarUrl ?? null,
  created_at: profile.createdAt ?? null,
  updated_at: profile.updatedAt ?? new Date().toISOString(),
});

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? fromProfileRow(data as ProfileRow) : null;
}

export async function upsertProfile(profile: UserProfile): Promise<UserProfile> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .upsert(toProfileRow(profile), { onConflict: "id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return fromProfileRow(data as ProfileRow);
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "createdAt">>,
): Promise<UserProfile> {
  const client = requireSupabase();
  const rowUpdates = {
    email: updates.email,
    display_name: updates.displayName,
    username: updates.username,
    home_region: updates.homeRegion,
    language: updates.language,
    theme: updates.theme,
    avatar_url: updates.avatarUrl,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from(TABLE_NAME)
    .update(rowUpdates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return fromProfileRow(data as ProfileRow);
}
