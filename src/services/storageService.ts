import { supabase } from "../lib/supabase";

const BUCKET_NAME = "event-images";
export const CLOUD_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const CLOUD_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

const throwStorageError = (error: unknown, fallback: string): never => {
  throw new Error(getSupabaseErrorMessage(error, fallback));
};

const safeFileName = (name: string) => {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "event-image";
};

export async function uploadEventImage(userId: string, eventId: string, file: File): Promise<string> {
  if (file.size > CLOUD_IMAGE_MAX_SIZE_BYTES) {
    throw new Error("Image is too large");
  }

  if (!CLOUD_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error("Only image files are allowed");
  }

  const client = requireSupabase();
  const path = `${userId}/${eventId}/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await client.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    throwStorageError(error, "Image upload failed");
  }

  return path;
}

export async function getEventImageSignedUrl(imagePath: string): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(BUCKET_NAME)
    .createSignedUrl(imagePath, 60 * 60);

  if (error) {
    throwStorageError(error, "Unable to create a signed image URL");
  }

  if (!data?.signedUrl) {
    throw new Error("Unable to create a signed image URL: Supabase returned an empty signed URL.");
  }

  return data.signedUrl;
}

export async function deleteEventImage(imagePath: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.storage.from(BUCKET_NAME).remove([imagePath]);

  if (error) {
    throwStorageError(error, "Unable to delete event image");
  }
}
