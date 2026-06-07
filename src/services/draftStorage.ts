export type DraftFormType = "event" | "ticket";
export type DraftMode = "new" | "edit";

interface DraftEnvelope<T> {
  version: 1;
  updatedAt: string;
  formType: DraftFormType;
  mode: DraftMode;
  entityId?: string;
  payload: T;
}

const isBrowser = () => typeof window !== "undefined" && Boolean(window.localStorage);

const getDraftMeta = (key: string): { formType: DraftFormType; mode: DraftMode; entityId?: string } | null => {
  if (key === "stagelog-event-draft-new") {
    return { formType: "event", mode: "new" };
  }

  if (key.startsWith("stagelog-event-draft-edit-")) {
    return { formType: "event", mode: "edit", entityId: key.replace("stagelog-event-draft-edit-", "") };
  }

  if (key.startsWith("stagelog-event-draft-ticket-")) {
    return { formType: "event", mode: "new" };
  }

  if (key === "stagelog-ticket-draft-new") {
    return { formType: "ticket", mode: "new" };
  }

  if (key.startsWith("stagelog-ticket-draft-edit-")) {
    return { formType: "ticket", mode: "edit", entityId: key.replace("stagelog-ticket-draft-edit-", "") };
  }

  return null;
};

const isDraftEnvelope = <T>(
  value: unknown,
  meta: { formType: DraftFormType; mode: DraftMode; entityId?: string },
): value is DraftEnvelope<T> => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Partial<DraftEnvelope<T>>;
  if (draft.version !== 1 || draft.formType !== meta.formType || draft.mode !== meta.mode || !("payload" in draft)) {
    return false;
  }

  if (meta.mode === "edit") {
    return draft.entityId === meta.entityId;
  }

  return !draft.entityId;
};

export function getDraft<T>(key: string): T | null {
  if (!isBrowser()) {
    return null;
  }

  const meta = getDraftMeta(key);

  if (!meta) {
    return null;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!isDraftEnvelope<T>(parsed, meta)) {
      clearDraft(key);
      return null;
    }

    return parsed.payload;
  } catch {
    clearDraft(key);
    return null;
  }
}

export function saveDraft<T>(key: string, value: T): void {
  if (!isBrowser()) {
    return;
  }

  const meta = getDraftMeta(key);

  if (!meta) {
    return;
  }

  const draft: DraftEnvelope<T> = {
    version: 1,
    updatedAt: new Date().toISOString(),
    formType: meta.formType,
    mode: meta.mode,
    entityId: meta.entityId,
    payload: value,
  };

  window.localStorage.setItem(key, JSON.stringify(draft));
}

export function clearDraft(key: string): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(key);
}

export function hasDraft(key: string): boolean {
  return getDraft<unknown>(key) !== null;
}

export const getEventDraftKey = (eventId?: string | null) =>
  eventId ? `stagelog-event-draft-edit-${eventId}` : "stagelog-event-draft-new";

export const getEventFromTicketDraftKey = (ticketId: string) => `stagelog-event-draft-ticket-${ticketId}`;

export const getTicketDraftKey = (ticketId?: string | null) =>
  ticketId ? `stagelog-ticket-draft-edit-${ticketId}` : "stagelog-ticket-draft-new";
