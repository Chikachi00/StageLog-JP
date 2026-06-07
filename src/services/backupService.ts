import type { StageLogBackup } from "../types/backup";
import type { EventRecord, SeatInfo, WeatherInfo } from "../types/event";
import type { AppLanguage, UserProfile } from "../types/profile";
import type {
  CurrencyCode,
  TicketApplication,
  TicketApplicationStatus,
  TicketPlatform,
  TicketRoundType,
} from "../types/ticket";
import type { CustomVenue, CustomVenueCategory } from "../types/venue";
import {
  currencyOptions,
  getAppliedQuantity,
  getTicketAmountDisplay,
  getTicketAmountOriginal,
  getWonQuantity,
  getPaidQuantity,
  normalizeTicketGroupKey,
  roundTypeOptions,
} from "../utils/ticketUtils";

const SUPPORTED_VERSION = 1;

interface CreateBackupOptions {
  mode: "local" | "cloud";
  userEmail?: string;
  events: EventRecord[];
  ticketApplications?: TicketApplication[];
  customVenues?: CustomVenue[];
  profile?: UserProfile | null;
  settings?: {
    language?: string;
    theme?: string;
  };
  notes?: string;
}

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `backup-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

const asOptionalString = (value: unknown) => {
  const text = asString(value).trim();
  return text || undefined;
};

const asNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

const asNumberLike = (value: unknown) => {
  const nextValue = typeof value === "string" ? Number(value) : value;
  return typeof nextValue === "number" && Number.isFinite(nextValue) ? nextValue : undefined;
};

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => asString(item).trim()).filter(Boolean) : undefined;

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

const normalizeCustomVenueCategory = (value: unknown): CustomVenueCategory | undefined => {
  const category = asString(value);
  return customVenueCategories.includes(category as CustomVenueCategory)
    ? (category as CustomVenueCategory)
    : undefined;
};

const normalizeSeat = (value: unknown): SeatInfo => {
  if (!isObject(value)) {
    return {};
  }

  return {
    gate: asOptionalString(value.gate),
    level: asOptionalString(value.level),
    block: asOptionalString(value.block),
    row: asOptionalString(value.row),
    number: asOptionalString(value.number),
    sectionId: asOptionalString(value.sectionId),
    sectionLabel: asOptionalString(value.sectionLabel),
    x: asNumber(value.x),
    y: asNumber(value.y),
  };
};

const normalizeWeather = (value: unknown): WeatherInfo | undefined => {
  if (!isObject(value)) {
    return undefined;
  }

  const temperature = asNumber(value.temperature);
  const precipitation = asNumber(value.precipitation);
  const windSpeed = asNumber(value.windSpeed);
  const weatherCode = asNumber(value.weatherCode);
  const fetchedAt = asOptionalString(value.fetchedAt);

  if (
    temperature === undefined ||
    precipitation === undefined ||
    windSpeed === undefined ||
    weatherCode === undefined ||
    !fetchedAt
  ) {
    return undefined;
  }

  return {
    temperature,
    precipitation,
    windSpeed,
    weatherCode,
    fetchedAt,
  };
};

export const normalizeBackupEvent = (value: unknown): EventRecord => {
  const now = new Date().toISOString();
  const event = isObject(value) ? value : {};

  return {
    id: asOptionalString(event.id) ?? createId(),
    title: asString(event.title),
    artist: asString(event.artist),
    date: asString(event.date),
    doorsOpenTime: asString(event.doorsOpenTime),
    startTime: asString(event.startTime),
    venueId: asString(event.venueId),
    venueName: asString(event.venueName),
    city: asString(event.city),
    country: asString(event.country),
    prefecture: asOptionalString(event.prefecture),
    region: asOptionalString(event.region),
    latitude: asNumber(event.latitude),
    longitude: asNumber(event.longitude),
    isCustomVenue: event.isCustomVenue === true,
    ticketType: asString(event.ticketType),
    seat: normalizeSeat(event.seat),
    imageUrl: asOptionalString(event.imageUrl),
    imagePath: asOptionalString(event.imagePath),
    weather: normalizeWeather(event.weather),
    notes: asString(event.notes),
    createdAt: asOptionalString(event.createdAt) ?? now,
    updatedAt: asOptionalString(event.updatedAt) ?? now,
  };
};

const normalizePlatform = (value: unknown): TicketPlatform => {
  const platform = asString(value);
  const options: TicketPlatform[] = ["eplus", "pia", "lawson", "ticketboard", "rakuten", "other"];
  return options.includes(platform as TicketPlatform) ? (platform as TicketPlatform) : "other";
};

const normalizeStatus = (value: unknown): TicketApplicationStatus => {
  const status = asString(value);
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
  return options.includes(status as TicketApplicationStatus) ? (status as TicketApplicationStatus) : "planned";
};

const normalizeCurrency = (value: unknown): CurrencyCode => {
  const currency = asString(value);
  return currencyOptions.includes(currency as CurrencyCode) ? (currency as CurrencyCode) : "CNY";
};

const normalizeRoundType = (value: unknown): TicketRoundType | undefined => {
  const roundType = asString(value);
  return roundTypeOptions.includes(roundType as TicketRoundType) ? (roundType as TicketRoundType) : undefined;
};

export const normalizeBackupTicketApplication = (value: unknown): TicketApplication => {
  const now = new Date().toISOString();
  const application = isObject(value) ? value : {};
  const baseApplication: TicketApplication = {
    id: asOptionalString(application.id) ?? createId(),
    eventTitle: asString(application.eventTitle),
    artist: asString(application.artist),
    venueId: asOptionalString(application.venueId),
    venueName: asOptionalString(application.venueName),
    city: asOptionalString(application.city),
    country: asOptionalString(application.country),
    prefecture: asOptionalString(application.prefecture),
    region: asOptionalString(application.region),
    latitude: asNumber(application.latitude),
    longitude: asNumber(application.longitude),
    isCustomVenue: application.isCustomVenue === true,
    eventDate: asOptionalString(application.eventDate),
    platform: normalizePlatform(application.platform),
    applicationDate: asOptionalString(application.applicationDate),
    resultDate: asOptionalString(application.resultDate),
    paymentDeadline: asOptionalString(application.paymentDeadline),
    issueDate: asOptionalString(application.issueDate),
    status: normalizeStatus(application.status),
    ticketType: asOptionalString(application.ticketType),
    price: asNumber(application.price),
    quantity: asNumber(application.quantity),
    companionName: asOptionalString(application.companionName),
    companionContact: asOptionalString(application.companionContact),
    memo: asOptionalString(application.memo),
    linkedEventId: asOptionalString(application.linkedEventId),
    ticketGroupKey: asOptionalString(application.ticketGroupKey),
    roundName: asOptionalString(application.roundName),
    roundType: normalizeRoundType(application.roundType),
    appliedQuantity: asNumber(application.appliedQuantity),
    wonQuantity: asNumber(application.wonQuantity),
    paidQuantity: asNumber(application.paidQuantity),
    currency: normalizeCurrency(application.currency),
    displayCurrency: normalizeCurrency(application.displayCurrency),
    amountOriginal: asNumber(application.amountOriginal),
    exchangeRateToDisplay: asNumber(application.exchangeRateToDisplay),
    amountDisplay: asNumber(application.amountDisplay),
    unitPriceOriginal: asNumber(application.unitPriceOriginal),
    createdAt: asOptionalString(application.createdAt) ?? now,
    updatedAt: asOptionalString(application.updatedAt) ?? now,
  };

  return {
    ...baseApplication,
    ticketGroupKey: baseApplication.ticketGroupKey ?? normalizeTicketGroupKey(baseApplication),
    appliedQuantity: getAppliedQuantity(baseApplication),
    wonQuantity: getWonQuantity(baseApplication),
    paidQuantity: getPaidQuantity(baseApplication),
    amountOriginal: getTicketAmountOriginal(baseApplication),
    amountDisplay: getTicketAmountDisplay(baseApplication),
    unitPriceOriginal: baseApplication.unitPriceOriginal ?? baseApplication.price,
  };
};

export const normalizeBackupCustomVenue = (value: unknown): CustomVenue => {
  const now = new Date().toISOString();
  const venue = isObject(value) ? value : {};

  return {
    id: asOptionalString(venue.id) ?? `custom:${createId()}`,
    userId: asOptionalString(venue.userId),
    name: asString(venue.name, "Custom venue"),
    nameJa: asOptionalString(venue.nameJa),
    nameZh: asOptionalString(venue.nameZh),
    aliases: asStringArray(venue.aliases),
    city: asString(venue.city, "Unknown"),
    country: asString(venue.country, "Japan"),
    prefecture: asOptionalString(venue.prefecture),
    region: asOptionalString(venue.region),
    latitude: asNumberLike(venue.latitude),
    longitude: asNumberLike(venue.longitude),
    category: normalizeCustomVenueCategory(venue.category),
    capacity: asNumberLike(venue.capacity),
    notes: asOptionalString(venue.notes),
    createdAt: asOptionalString(venue.createdAt) ?? now,
    updatedAt: asOptionalString(venue.updatedAt) ?? now,
  };
};

const normalizeProfile = (value: unknown): UserProfile | null => {
  if (!isObject(value)) {
    return null;
  }

  const language: AppLanguage = value.language === "zh" ? "zh" : "en";

  return {
    id: asString(value.id),
    email: asOptionalString(value.email),
    displayName: asOptionalString(value.displayName),
    username: asOptionalString(value.username),
    homeRegion: asOptionalString(value.homeRegion),
    language,
    theme: asString(value.theme, "sakura") as UserProfile["theme"],
    avatarUrl: asOptionalString(value.avatarUrl),
    createdAt: asOptionalString(value.createdAt),
    updatedAt: asOptionalString(value.updatedAt),
  };
};

export function createBackup(options: CreateBackupOptions): StageLogBackup {
  return {
    appName: "StageLog JP",
    version: SUPPORTED_VERSION,
    exportedAt: new Date().toISOString(),
    mode: options.mode,
    userEmail: options.userEmail,
    data: {
      events: options.events,
      ticketApplications: options.ticketApplications ?? [],
      customVenues: options.customVenues,
      profile: options.profile ?? null,
      settings: options.settings,
    },
    notes: options.notes,
  };
}

const getBackupFileName = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}`;
  return `stagelog-backup-${stamp}.json`;
};

export function downloadBackup(backup: StageLogBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getBackupFileName(new Date(backup.exportedAt));
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function validateBackup(value: unknown): StageLogBackup {
  if (!isObject(value)) {
    throw new Error("Invalid backup file.");
  }

  if (value.appName !== "StageLog JP") {
    throw new Error("Invalid backup file.");
  }

  if (value.version !== SUPPORTED_VERSION) {
    throw new Error("Unsupported backup version.");
  }

  if (!isObject(value.data) || !Array.isArray(value.data.events)) {
    throw new Error("Invalid backup file.");
  }

  const ticketApplications = Array.isArray(value.data.ticketApplications)
    ? value.data.ticketApplications.map(normalizeBackupTicketApplication)
    : [];
  const customVenues = Array.isArray(value.data.customVenues)
    ? value.data.customVenues.map(normalizeBackupCustomVenue)
    : undefined;

  return {
    appName: "StageLog JP",
    version: SUPPORTED_VERSION,
    exportedAt: asOptionalString(value.exportedAt) ?? new Date().toISOString(),
    mode: value.mode === "cloud" ? "cloud" : "local",
    userEmail: asOptionalString(value.userEmail),
    data: {
      events: value.data.events.map(normalizeBackupEvent),
      ticketApplications,
      customVenues,
      profile: normalizeProfile(value.data.profile),
      settings: isObject(value.data.settings)
        ? {
            language: asOptionalString(value.data.settings.language),
            theme: asOptionalString(value.data.settings.theme),
          }
        : undefined,
    },
    notes: asOptionalString(value.notes),
  };
}

export async function parseBackupFile(file: File): Promise<StageLogBackup> {
  if (!file.name.toLowerCase().endsWith(".json") && file.type && file.type !== "application/json") {
    throw new Error("Invalid backup file.");
  }

  const text = await file.text();

  try {
    return validateBackup(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid backup file.");
    }

    throw error;
  }
}

export const getEventBackupKey = (event: EventRecord) =>
  [event.title, event.artist, event.date, event.venueId].join("::").toLocaleLowerCase();

export const getTicketBackupKey = (application: TicketApplication) =>
  [
    application.ticketGroupKey ?? normalizeTicketGroupKey(application),
    application.roundName ?? application.roundType ?? "",
    application.platform,
    application.applicationDate ?? "",
    application.eventTitle,
    application.artist,
    application.eventDate ?? "",
    application.venueId ?? application.venueName ?? "",
  ]
    .join("::")
    .toLocaleLowerCase();
