import { Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { clearDraft, getDraft, getTicketDraftKey, hasDraft, saveDraft } from "../services/draftStorage";
import type { CustomVenueInput } from "../services/customVenueService";
import type { EventRecord, Venue } from "../types/event";
import type { TicketApplication, TicketApplicationFormValues, TicketRoundPreset } from "../types/ticket";
import type { CustomVenue } from "../types/venue";
import type { VenueValue } from "../utils/venueSearchUtils";
import {
  currencyOptions,
  getAppliedQuantity,
  getPaidQuantity,
  getTicketAmountDisplay,
  getTicketAmountOriginal,
  getTicketDisplayCurrency,
  getTicketOriginalCurrency,
  getWonQuantity,
  platformOptions,
  roundTypeOptions,
  statusOptions,
} from "../utils/ticketUtils";
import { VenueCombobox } from "./VenueCombobox";

interface TicketApplicationFormProps {
  venues: Venue[];
  customVenues?: CustomVenue[];
  events?: EventRecord[];
  ticketApplications?: TicketApplication[];
  editingApplication?: TicketApplication | null;
  roundPreset?: TicketRoundPreset | null;
  initialFocus?: "eventTitle" | "roundName" | null;
  focusRequestId?: number;
  onCreateCustomVenue?: (input: CustomVenueInput) => Promise<CustomVenue> | CustomVenue;
  onSave: (values: TicketApplicationFormValues, options?: { addAnother?: boolean }) => void | Promise<void>;
  onCancel: () => void;
}

type TicketDraftPayload = TicketApplicationFormValues & {
  linkedEventId?: string;
};

const parseOptionalPresetNumber = (value?: string) => {
  if (!value?.trim()) {
    return undefined;
  }

  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

const createInitialValues = (
  editingApplication?: TicketApplication | null,
  roundPreset?: TicketRoundPreset | null,
): TicketApplicationFormValues => ({
  ticketGroupKey: editingApplication?.ticketGroupKey ?? roundPreset?.ticketGroupKey ?? "",
  eventTitle: editingApplication?.eventTitle ?? roundPreset?.eventTitle ?? "",
  artist: editingApplication?.artist ?? roundPreset?.artist ?? "",
  venueId: editingApplication?.venueId ?? roundPreset?.venueId ?? "",
  venueName: editingApplication?.venueName ?? roundPreset?.venueName ?? "",
  city: editingApplication?.city ?? roundPreset?.city ?? "",
  country: editingApplication?.country ?? roundPreset?.country ?? "Japan",
  prefecture: editingApplication?.prefecture ?? roundPreset?.prefecture ?? "",
  region: editingApplication?.region ?? roundPreset?.region ?? "",
  latitude:
    typeof editingApplication?.latitude === "number"
      ? String(editingApplication.latitude)
      : typeof roundPreset?.latitude === "number"
        ? String(roundPreset.latitude)
        : "",
  longitude:
    typeof editingApplication?.longitude === "number"
      ? String(editingApplication.longitude)
      : typeof roundPreset?.longitude === "number"
        ? String(roundPreset.longitude)
        : "",
  isCustomVenue:
    editingApplication?.isCustomVenue ??
    roundPreset?.isCustomVenue ??
    editingApplication?.venueId?.startsWith("custom:") ??
    roundPreset?.venueId?.startsWith("custom:") ??
    false,
  eventDate: editingApplication?.eventDate ?? roundPreset?.eventDate ?? "",
  platform: editingApplication?.platform ?? "eplus",
  applicationDate: editingApplication?.applicationDate ?? "",
  resultDate: editingApplication?.resultDate ?? "",
  paymentDeadline: editingApplication?.paymentDeadline ?? "",
  issueDate: editingApplication?.issueDate ?? "",
  status: editingApplication?.status ?? "planned",
  ticketType: editingApplication?.ticketType ?? "",
  price: typeof editingApplication?.price === "number" ? String(editingApplication.price) : "",
  quantity: typeof editingApplication?.quantity === "number" ? String(editingApplication.quantity) : "1",
  roundName: editingApplication?.roundName ?? "",
  roundType: editingApplication?.roundType ?? "other",
  appliedQuantity: String(editingApplication ? getAppliedQuantity(editingApplication) : 1),
  wonQuantity: String(editingApplication ? getWonQuantity(editingApplication) : 0),
  paidQuantity:
    editingApplication && typeof editingApplication.paidQuantity === "number"
      ? String(getPaidQuantity(editingApplication))
      : "",
  currency: editingApplication ? getTicketOriginalCurrency(editingApplication) : "CNY",
  displayCurrency: editingApplication ? getTicketDisplayCurrency(editingApplication) : roundPreset?.displayCurrency ?? "CNY",
  amountOriginal:
    editingApplication && typeof getTicketAmountOriginal(editingApplication) === "number"
      ? String(getTicketAmountOriginal(editingApplication))
      : "",
  exchangeRateToDisplay:
    typeof editingApplication?.exchangeRateToDisplay === "number"
      ? String(editingApplication.exchangeRateToDisplay)
      : editingApplication && getTicketOriginalCurrency(editingApplication) === getTicketDisplayCurrency(editingApplication)
        ? "1"
        : "",
  amountDisplay:
    editingApplication && typeof getTicketAmountDisplay(editingApplication) === "number"
      ? String(getTicketAmountDisplay(editingApplication))
      : "",
  unitPriceOriginal:
    typeof editingApplication?.unitPriceOriginal === "number"
      ? String(editingApplication.unitPriceOriginal)
      : typeof editingApplication?.price === "number"
        ? String(editingApplication.price)
        : "",
  companionName: editingApplication?.companionName ?? "",
  companionContact: editingApplication?.companionContact ?? "",
  memo: editingApplication?.memo ?? "",
});

export function TicketApplicationForm({
  venues,
  customVenues = [],
  events = [],
  ticketApplications = [],
  editingApplication,
  roundPreset,
  initialFocus = null,
  focusRequestId = 0,
  onCreateCustomVenue,
  onSave,
  onCancel,
}: TicketApplicationFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<TicketApplicationFormValues>(() =>
    createInitialValues(editingApplication, roundPreset),
  );
  const [error, setError] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const valuesRef = useRef(values);
  const isDirtyRef = useRef(false);
  const eventTitleRef = useRef<HTMLInputElement | null>(null);
  const roundNameRef = useRef<HTMLInputElement | null>(null);
  const draftKey = useMemo(() => getTicketDraftKey(editingApplication?.id), [editingApplication?.id]);

  useEffect(() => {
    setValues(createInitialValues(editingApplication, roundPreset));
    setError("");
    setDraftStatus("");
    setIsDirty(false);
    isDirtyRef.current = false;
    const draft = getDraft<TicketDraftPayload>(getTicketDraftKey(editingApplication?.id));

    if (draft && !roundPreset) {
      setValues({
        ...createInitialValues(editingApplication, roundPreset),
        ...draft,
      });
      setDraftStatus(t("tickets.draftAutoRestored"));
      setIsDirty(true);
      isDirtyRef.current = true;
    }
  }, [editingApplication, roundPreset, t]);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    const target =
      initialFocus === "roundName"
        ? roundNameRef.current
        : initialFocus === "eventTitle"
          ? eventTitleRef.current
          : null;

    if (!target) {
      return;
    }

    const timer = window.setTimeout(() => {
      target.focus();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [focusRequestId, initialFocus]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === values.venueId),
    [venues, values.venueId],
  );
  const venueValue = useMemo<VenueValue>(
    () => ({
      venueId: values.venueId,
      venueName: values.venueName,
      city: values.city,
      country: values.country,
      prefecture: values.prefecture,
      region: values.region,
      latitude: parseOptionalPresetNumber(values.latitude),
      longitude: parseOptionalPresetNumber(values.longitude),
      isCustomVenue: values.isCustomVenue,
    }),
    [
      values.city,
      values.country,
      values.isCustomVenue,
      values.latitude,
      values.longitude,
      values.prefecture,
      values.region,
      values.venueId,
      values.venueName,
    ],
  );

  const updateVenue = (venue: VenueValue) => {
    setIsDirty(true);
    setValues((current) => ({
      ...current,
      venueId: venue.venueId ?? "",
      venueName: venue.venueName ?? "",
      city: venue.city ?? "",
      country: venue.country ?? "Japan",
      prefecture: venue.prefecture ?? "",
      region: venue.region ?? "",
      latitude: typeof venue.latitude === "number" ? String(venue.latitude) : "",
      longitude: typeof venue.longitude === "number" ? String(venue.longitude) : "",
      isCustomVenue: venue.isCustomVenue ?? false,
    }));
  };

  const updateValue = (field: keyof TicketApplicationFormValues, value: string) => {
    setIsDirty(true);
    setValues((current) => {
      const nextValues = { ...current, [field]: value };

      if ((field === "currency" || field === "displayCurrency") && nextValues.currency === nextValues.displayCurrency) {
        nextValues.exchangeRateToDisplay = "1";
      }

      return nextValues;
    });
  };

  const createDraftPayload = useCallback(
    (currentValues: TicketApplicationFormValues): TicketDraftPayload => {
      return {
        ...currentValues,
        linkedEventId: editingApplication?.linkedEventId,
      };
    },
    [editingApplication?.linkedEventId],
  );

  const saveCurrentDraft = useCallback(() => {
    if (!isDirtyRef.current) {
      return;
    }

    saveDraft(draftKey, createDraftPayload(valuesRef.current));
    setDraftStatus(t("draft.saved"));
  }, [createDraftPayload, draftKey, t]);

  useEffect(() => {
    const amountOriginal = Number(values.amountOriginal);
    const exchangeRate = values.currency === values.displayCurrency ? 1 : Number(values.exchangeRateToDisplay);

    if (!values.amountOriginal || Number.isNaN(amountOriginal) || amountOriginal < 0) {
      return;
    }

    if (Number.isNaN(exchangeRate) || exchangeRate < 0) {
      return;
    }

    const nextAmountDisplay = String(Math.round(amountOriginal * exchangeRate * 100) / 100);
    const nextExchangeRate = values.currency === values.displayCurrency ? "1" : values.exchangeRateToDisplay;

    if (values.amountDisplay === nextAmountDisplay && values.exchangeRateToDisplay === nextExchangeRate) {
      return;
    }

    setValues((current) => ({
      ...current,
      exchangeRateToDisplay: nextExchangeRate,
      amountDisplay: nextAmountDisplay,
    }));
  }, [values.amountDisplay, values.amountOriginal, values.currency, values.displayCurrency, values.exchangeRateToDisplay]);

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      saveCurrentDraft();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [isDirty, saveCurrentDraft, values]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveCurrentDraft();
      }
    };

    const handlePageHide = () => {
      saveCurrentDraft();
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) {
        return;
      }

      saveCurrentDraft();
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveCurrentDraft]);

  useEffect(
    () => () => {
      saveCurrentDraft();
    },
    [saveCurrentDraft],
  );

  const discardDraft = () => {
    clearDraft(draftKey);
    setDraftStatus(t("draft.discarded"));
    setIsDirty(false);
    isDirtyRef.current = false;
    setValues(createInitialValues(editingApplication, roundPreset));
  };

  const handleCancel = () => {
    if (isDirty && hasDraft(draftKey)) {
      const confirmed = window.confirm(`${t("draft.unsavedChanges")}. ${t("draft.saved")}`);

      if (!confirmed) {
        return;
      }
    }

    clearDraft(draftKey);
    onCancel();
  };

  const validate = () => {
    if (!values.eventTitle.trim() || !values.artist.trim() || !values.platform || !values.status) {
      return t("tickets.requiredError");
    }

    if (values.price && Number(values.price) < 0) {
      return t("tickets.priceError");
    }

    if (values.quantity && (!Number.isInteger(Number(values.quantity)) || Number(values.quantity) <= 0)) {
      return t("tickets.quantityError");
    }

    const appliedQuantity = Number(values.appliedQuantity);
    const wonQuantity = Number(values.wonQuantity || 0);
    const paidQuantity = values.paidQuantity ? Number(values.paidQuantity) : 0;

    if (!Number.isInteger(appliedQuantity) || appliedQuantity <= 0) {
      return t("tickets.appliedQuantityError");
    }

    if (!Number.isInteger(wonQuantity) || wonQuantity < 0 || wonQuantity > appliedQuantity) {
      return t("tickets.wonQuantityError");
    }

    if (!Number.isInteger(paidQuantity) || paidQuantity < 0 || paidQuantity > wonQuantity) {
      return t("tickets.paidQuantityError");
    }

    for (const [field, messageKey] of [
      [values.unitPriceOriginal, "tickets.priceError"],
      [values.amountOriginal, "tickets.amountError"],
      [values.exchangeRateToDisplay, "tickets.exchangeRateError"],
      [values.amountDisplay, "tickets.amountError"],
    ] as const) {
      if (field && (Number.isNaN(Number(field)) || Number(field) < 0)) {
        return t(messageKey);
      }
    }

    return "";
  };

  const submitValues = async (options?: { addAnother?: boolean }) => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    saveCurrentDraft();
    setIsDirty(false);
    isDirtyRef.current = false;
    try {
      await onSave({
        ...values,
        eventTitle: values.eventTitle.trim(),
        artist: values.artist.trim(),
        roundName: values.roundName.trim(),
        ticketType: values.ticketType.trim(),
        companionName: values.companionName.trim(),
        companionContact: values.companionContact.trim(),
        memo: values.memo.trim(),
      }, options);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : t("notice.ticketSaveFailed");
      setError(message);
      setIsDirty(true);
      isDirtyRef.current = true;
      return;
    }

    if (!editingApplication && options?.addAnother) {
      setValues((current) => ({
        ...createInitialValues(undefined, {
          ticketGroupKey: current.ticketGroupKey,
          eventTitle: current.eventTitle,
          artist: current.artist,
          eventDate: current.eventDate || undefined,
          venueId: current.venueId || undefined,
          venueName: current.venueName || undefined,
          city: current.city || undefined,
          country: current.country || undefined,
          prefecture: current.prefecture || undefined,
          region: current.region || undefined,
          latitude: parseOptionalPresetNumber(current.latitude),
          longitude: parseOptionalPresetNumber(current.longitude),
          isCustomVenue: current.isCustomVenue,
          displayCurrency: current.displayCurrency,
        }),
        platform: current.platform,
        status: "applied",
        currency: current.currency,
        displayCurrency: current.displayCurrency,
        exchangeRateToDisplay: current.currency === current.displayCurrency ? "1" : "",
      }));
      setDraftStatus(t("tickets.addAnotherRound"));
    } else if (!editingApplication) {
      setValues(createInitialValues(undefined, roundPreset));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitValues();
  };

  const handleSaveAndAddAnother = () => {
    void submitValues({ addAnother: true });
  };

  const presetVenue = roundPreset?.venueName || selectedVenue?.name;

  return (
    <section className="form-panel ticket-application-form" aria-labelledby="ticket-form-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{editingApplication ? t("tickets.formEyebrowEdit") : t("tickets.formEyebrowNew")}</span>
          <h2 id="ticket-form-title">{editingApplication ? t("tickets.editApplication") : t("tickets.addApplication")}</h2>
        </div>
        {editingApplication ? (
          <button className="ghost-button" type="button" onClick={handleCancel}>
            <X size={16} aria-hidden="true" />
            {t("tickets.cancel")}
          </button>
        ) : null}
      </div>

      <p className="draft-status">
        {t("tickets.ticketRecordHint")} {t("tickets.ticketRecordGroupingHint")}
      </p>
      {roundPreset && !editingApplication ? (
        <section className="draft-banner" aria-label={t("tickets.ticketGroup")}>
          <strong>{t("tickets.addingRoundToPerformance")}</strong>
          <span>
            {roundPreset.eventTitle} / {roundPreset.artist}
            {roundPreset.eventDate ? ` / ${roundPreset.eventDate}` : ""}
            {presetVenue ? ` / ${presetVenue}` : ""}
          </span>
        </section>
      ) : null}

      {draftStatus ? (
        <section className="draft-banner" aria-label={t("draft.ticketDraft")}>
          <strong>{draftStatus}</strong>
          <div>
            <button className="ghost-button" type="button" onClick={discardDraft}>
              {t("draft.discard")}
            </button>
          </div>
        </section>
      ) : null}

      <form className="event-form" onSubmit={handleSubmit}>
        <h3 className="event-form__wide">{t("tickets.performanceInfo")}</h3>
        <input type="hidden" value={values.ticketGroupKey} readOnly />
        <label>
          {t("tickets.eventTitle")}
          <input ref={eventTitleRef} required value={values.eventTitle} onChange={(event) => updateValue("eventTitle", event.target.value)} />
        </label>
        <label>
          {t("tickets.artist")}
          <input required value={values.artist} onChange={(event) => updateValue("artist", event.target.value)} />
        </label>
        <VenueCombobox
          customVenues={customVenues}
          events={events}
          label={t("tickets.venue")}
          placeholder={t("tickets.noVenue")}
          ticketApplications={ticketApplications}
          value={venueValue}
          venues={venues}
          onCreateCustomVenue={onCreateCustomVenue}
          onChange={updateVenue}
        />
        <label>
          {t("tickets.eventDate")}
          <input type="date" value={values.eventDate} onChange={(event) => updateValue("eventDate", event.target.value)} />
        </label>
        <h3 className="event-form__wide">{t("tickets.roundInformation")}</h3>
        <label>
          {t("tickets.roundName")}
          <input ref={roundNameRef} value={values.roundName} onChange={(event) => updateValue("roundName", event.target.value)} />
        </label>
        <label>
          {t("tickets.roundType")}
          <select value={values.roundType} onChange={(event) => updateValue("roundType", event.target.value)}>
            {roundTypeOptions.map((roundType) => (
              <option key={roundType} value={roundType}>
                {t(`roundType.${roundType}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("tickets.platform")}
          <select required value={values.platform} onChange={(event) => updateValue("platform", event.target.value)}>
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {t(`platform.${platform}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("tickets.status")}
          <select required value={values.status} onChange={(event) => updateValue("status", event.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("tickets.applicationDate")}
          <input type="date" value={values.applicationDate} onChange={(event) => updateValue("applicationDate", event.target.value)} />
        </label>
        <label>
          {t("tickets.resultDate")}
          <input type="date" value={values.resultDate} onChange={(event) => updateValue("resultDate", event.target.value)} />
        </label>
        <label>
          {t("tickets.paymentDeadline")}
          <input type="date" value={values.paymentDeadline} onChange={(event) => updateValue("paymentDeadline", event.target.value)} />
        </label>
        <label>
          {t("tickets.issueDate")}
          <input type="date" value={values.issueDate} onChange={(event) => updateValue("issueDate", event.target.value)} />
        </label>
        <label>
          {t("tickets.ticketType")}
          <input value={values.ticketType} onChange={(event) => updateValue("ticketType", event.target.value)} />
        </label>
        <h3 className="event-form__wide">{t("tickets.quantitySection")}</h3>
        <label>
          {t("tickets.appliedQuantity")}
          <input min="1" step="1" type="number" value={values.appliedQuantity} onChange={(event) => updateValue("appliedQuantity", event.target.value)} />
        </label>
        <label>
          {t("tickets.wonQuantity")}
          <input min="0" step="1" type="number" value={values.wonQuantity} onChange={(event) => updateValue("wonQuantity", event.target.value)} />
        </label>
        <label>
          {t("tickets.paidQuantity")}
          <input min="0" step="1" type="number" value={values.paidQuantity} onChange={(event) => updateValue("paidQuantity", event.target.value)} />
        </label>
        <h3 className="event-form__wide">{t("tickets.currencySection")}</h3>
        <label>
          {t("tickets.originalCurrency")}
          <select value={values.currency} onChange={(event) => updateValue("currency", event.target.value)}>
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {t(`currency.${currency}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("tickets.displayCurrency")}
          <select value={values.displayCurrency} onChange={(event) => updateValue("displayCurrency", event.target.value)}>
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {t(`currency.${currency}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("tickets.unitPriceOriginal")}
          <input min="0" type="number" value={values.unitPriceOriginal} onChange={(event) => updateValue("unitPriceOriginal", event.target.value)} />
        </label>
        <label>
          {t("tickets.amountOriginal")}
          <input min="0" type="number" value={values.amountOriginal} onChange={(event) => updateValue("amountOriginal", event.target.value)} />
        </label>
        <label>
          {t("tickets.exchangeRateToDisplay")}
          <input min="0" step="0.0001" type="number" value={values.exchangeRateToDisplay} onChange={(event) => updateValue("exchangeRateToDisplay", event.target.value)} />
        </label>
        <label>
          {t("tickets.amountDisplay")}
          <input min="0" type="number" value={values.amountDisplay} onChange={(event) => updateValue("amountDisplay", event.target.value)} />
        </label>
        <p className="event-form__wide draft-status">{t("tickets.manualExchangeHint")}</p>
        <label>
          {t("tickets.price")}
          <input min="0" type="number" value={values.price} onChange={(event) => updateValue("price", event.target.value)} />
        </label>
        <label>
          {t("tickets.quantity")}
          <input min="1" step="1" type="number" value={values.quantity} onChange={(event) => updateValue("quantity", event.target.value)} />
        </label>
        <h3 className="event-form__wide">{t("tickets.companionSection")}</h3>
        <label>
          {t("tickets.companionName")}
          <input value={values.companionName} onChange={(event) => updateValue("companionName", event.target.value)} />
        </label>
        <label>
          {t("tickets.companionContact")}
          <input value={values.companionContact} onChange={(event) => updateValue("companionContact", event.target.value)} />
        </label>
        <div className="venue-readout">
          <span>{t("eventForm.venueDetails")}</span>
          <strong>
            {selectedVenue
              ? `${selectedVenue.city}, ${selectedVenue.prefecture ?? selectedVenue.country} · ${
                  selectedVenue.category ? t(`venues.categories.${selectedVenue.category}`) : t("venues.categories.other")
                }`
              : values.venueName
                ? `${values.city || "Unknown"}, ${values.country || "Japan"} / ${t("venueSearch.customVenue")}`
                : t("common.optional")}
          </strong>
        </div>
        <label className="event-form__wide">
          {t("tickets.memo")}
          <textarea rows={4} value={values.memo} onChange={(event) => updateValue("memo", event.target.value)} />
        </label>
        {error ? <p className="form-error event-form__wide">{error}</p> : null}
        <button className="primary-button event-form__submit" type="submit">
          <Save size={18} aria-hidden="true" />
          {t("tickets.save")}
        </button>
        {!editingApplication ? (
          <button className="ghost-button event-form__submit" type="button" onClick={handleSaveAndAddAnother}>
            <Save size={18} aria-hidden="true" />
            {t("tickets.saveAndAddAnotherRound")}
          </button>
        ) : null}
      </form>
    </section>
  );
}
