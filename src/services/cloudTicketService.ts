import { supabase } from "../lib/supabase";
import type {
  CurrencyCode,
  TicketApplication,
  TicketApplicationStatus,
  TicketPlatform,
  TicketRoundType,
} from "../types/ticket";
import {
  currencyOptions,
  getAppliedQuantity,
  getPaidQuantity,
  getTicketAmountDisplay,
  getTicketAmountOriginal,
  getTicketDisplayCurrency,
  getTicketOriginalCurrency,
  getWonQuantity,
  normalizeTicketGroupKey,
  roundTypeOptions,
} from "../utils/ticketUtils";

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
  ticket_group_key: string | null;
  round_name: string | null;
  round_type: string | null;
  applied_quantity: number | null;
  won_quantity: number | null;
  paid_quantity: number | null;
  currency: string | null;
  display_currency: string | null;
  amount_original: number | string | null;
  exchange_rate_to_display: number | string | null;
  amount_display: number | string | null;
  unit_price_original: number | string | null;
  created_at: string | null;
  updated_at: string | null;
}

type CloudTicketApplicationPayload = Omit<CloudTicketApplicationRow, "id"> & {
  id?: string;
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

const cleanOptionalNumber = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;

const normalizeNumber = (value: number | string | null | undefined) => {
  const nextValue = typeof value === "string" ? Number(value) : value;
  return typeof nextValue === "number" && Number.isFinite(nextValue) && nextValue >= 0
    ? nextValue
    : undefined;
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

const normalizeCurrency = (currency: string | null | undefined): CurrencyCode =>
  currencyOptions.includes(currency as CurrencyCode) ? (currency as CurrencyCode) : "CNY";

const normalizeRoundType = (roundType: string | null | undefined): TicketRoundType | undefined =>
  roundTypeOptions.includes(roundType as TicketRoundType) ? (roundType as TicketRoundType) : undefined;

export const toCloudTicketApplicationRow = (
  application: TicketApplication,
  userId: string,
  options: { includeId?: boolean } = {},
): CloudTicketApplicationPayload => {
  const currency = getTicketOriginalCurrency(application);
  const displayCurrency = getTicketDisplayCurrency(application);
  const amountOriginal = getTicketAmountOriginal(application);
  const amountDisplay = getTicketAmountDisplay(application);
  const payload: CloudTicketApplicationPayload = {
    user_id: userId,
    event_title: application.eventTitle,
    artist: application.artist,
    venue_id: cleanOptionalString(application.venueId),
    venue_name: cleanOptionalString(application.venueName),
    city: cleanOptionalString(application.city),
    country: cleanOptionalString(application.country),
    event_date: cleanOptionalString(application.eventDate),
    platform: application.platform,
    application_date: cleanOptionalString(application.applicationDate),
    result_date: cleanOptionalString(application.resultDate),
    payment_deadline: cleanOptionalString(application.paymentDeadline),
    issue_date: cleanOptionalString(application.issueDate),
    status: application.status,
    ticket_type: cleanOptionalString(application.ticketType),
    price: application.price ?? null,
    quantity: application.quantity ?? null,
    companion_name: cleanOptionalString(application.companionName),
    companion_contact: cleanOptionalString(application.companionContact),
    memo: cleanOptionalString(application.memo),
    linked_event_id: cleanOptionalString(application.linkedEventId),
    ticket_group_key: cleanOptionalString(application.ticketGroupKey ?? normalizeTicketGroupKey(application)),
    round_name: cleanOptionalString(application.roundName),
    round_type: application.roundType ?? null,
    applied_quantity: cleanOptionalNumber(application.appliedQuantity ?? getAppliedQuantity(application)),
    won_quantity: cleanOptionalNumber(application.wonQuantity ?? getWonQuantity(application)),
    paid_quantity: cleanOptionalNumber(application.paidQuantity ?? getPaidQuantity(application)),
    currency,
    display_currency: displayCurrency,
    amount_original: cleanOptionalNumber(amountOriginal),
    exchange_rate_to_display: cleanOptionalNumber(
      application.exchangeRateToDisplay ?? (currency === displayCurrency && typeof amountOriginal === "number" ? 1 : undefined),
    ),
    amount_display: cleanOptionalNumber(amountDisplay),
    unit_price_original: cleanOptionalNumber(application.unitPriceOriginal ?? application.price),
    created_at: application.createdAt,
    updated_at: application.updatedAt,
  };

  if (options.includeId && isUuid(application.id)) {
    payload.id = application.id;
  }

  return payload;
};

export const fromCloudTicketApplicationRow = (row: CloudTicketApplicationRow): TicketApplication => {
  const now = new Date().toISOString();
  const price = typeof row.price === "string" ? Number(row.price) : row.price;
  const application: TicketApplication = {
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
    ticketGroupKey: row.ticket_group_key ?? undefined,
    roundName: row.round_name ?? undefined,
    roundType: normalizeRoundType(row.round_type),
    appliedQuantity: typeof row.applied_quantity === "number" ? row.applied_quantity : undefined,
    wonQuantity: typeof row.won_quantity === "number" ? row.won_quantity : undefined,
    paidQuantity: typeof row.paid_quantity === "number" ? row.paid_quantity : undefined,
    currency: normalizeCurrency(row.currency),
    displayCurrency: normalizeCurrency(row.display_currency),
    amountOriginal: normalizeNumber(row.amount_original),
    exchangeRateToDisplay: normalizeNumber(row.exchange_rate_to_display),
    amountDisplay: normalizeNumber(row.amount_display),
    unitPriceOriginal: normalizeNumber(row.unit_price_original),
    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? row.created_at ?? now,
  };

  return {
    ...application,
    ticketGroupKey: application.ticketGroupKey ?? normalizeTicketGroupKey(application),
    appliedQuantity: getAppliedQuantity(application),
    wonQuantity: getWonQuantity(application),
    paidQuantity: getPaidQuantity(application),
    amountOriginal: getTicketAmountOriginal(application),
    amountDisplay: getTicketAmountDisplay(application),
    unitPriceOriginal: application.unitPriceOriginal ?? application.price,
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
    throwSupabaseError(error, "Failed to load cloud ticket applications.");
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
    .insert(toCloudTicketApplicationRow(application, userId, { includeId: false }))
    .select()
    .single();

  if (error) {
    throwSupabaseError(error, "Failed to save ticket application.");
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
    .update(toCloudTicketApplicationRow(application, userId, { includeId: false }))
    .eq("id", application.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throwSupabaseError(error, "Failed to save ticket application.");
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
    throwSupabaseError(error, "Failed to delete ticket application.");
  }
}
