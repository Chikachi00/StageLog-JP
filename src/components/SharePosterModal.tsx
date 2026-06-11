import { Copy, Download, FileImage, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EventRecord } from "../types/event";
import type { AppTheme } from "../types/theme";
import type { TicketApplication } from "../types/ticket";
import {
  getDefaultSharePosterYear,
  getEventsForSharePosterYear,
  getSharePosterYears,
  SHARE_POSTER_MAX_EVENTS,
  sortPosterEvents,
  STAGELOG_GITHUB_URL,
  type SharePosterMode,
  type SharePosterPrivacyOptions,
  type SharePosterText,
  type SharePosterTheme,
} from "../utils/sharePosterUtils";
import {
  generateSelectedEventsPosterSvg,
  generateYearlyReportPosterSvg,
  getPosterFilename,
} from "../utils/posterSvgTemplates";
import { copyTextToClipboard, downloadPngFromSvg, downloadSvgFile } from "../utils/svgExportUtils";
import { SharePosterPreview } from "./SharePosterPreview";

interface SharePosterModalProps {
  events: EventRecord[];
  isOpen: boolean;
  theme: AppTheme;
  ticketApplications: TicketApplication[];
  onClose: () => void;
}

const themeOptions: SharePosterTheme[] = ["sakura", "ocean", "night", "classic"];

const defaultPrivacy: SharePosterPrivacyOptions = {
  showSeat: false,
  showPrice: false,
  showNotes: false,
  showWeather: true,
  showAttribution: true,
  showTicketType: true,
};

const isPosterTheme = (theme: AppTheme): theme is SharePosterTheme =>
  theme === "sakura" || theme === "ocean" || theme === "night" || theme === "classic";

export function SharePosterModal({ events, isOpen, theme, ticketApplications, onClose }: SharePosterModalProps) {
  const { i18n, t } = useTranslation();
  const sortedEvents = useMemo(() => sortPosterEvents(events), [events]);
  const yearOptions = useMemo(() => getSharePosterYears(events), [events]);
  const [mode, setMode] = useState<SharePosterMode>("selected");
  const [posterTheme, setPosterTheme] = useState<SharePosterTheme>(() => (isPosterTheme(theme) ? theme : "ocean"));
  const [selectedYear, setSelectedYear] = useState(() => getDefaultSharePosterYear(events));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<SharePosterPrivacyOptions>(defaultPrivacy);
  const [feedback, setFeedback] = useState("");
  const [exportError, setExportError] = useState("");
  const [isExportingPng, setIsExportingPng] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setPosterTheme(isPosterTheme(theme) ? theme : "ocean");
  }, [isOpen, theme]);

  useEffect(() => {
    if (!isOpen || selectedIds.length > 0 || sortedEvents.length === 0) {
      return;
    }

    setSelectedIds(sortedEvents.slice(0, Math.min(6, SHARE_POSTER_MAX_EVENTS)).map((event) => event.id));
  }, [isOpen, selectedIds.length, sortedEvents]);

  useEffect(() => {
    if (yearOptions.length === 0) {
      setSelectedYear(String(new Date().getFullYear()));
      return;
    }

    if (!yearOptions.includes(selectedYear)) {
      setSelectedYear(yearOptions[0]);
    }
  }, [selectedYear, yearOptions]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const posterText: SharePosterText = useMemo(
    () => ({
      generatedBy: t("sharePoster.generatedBy"),
      selectedHeading: t("sharePoster.myLiveMemoryBoard"),
      yearlyHeading: t("sharePoster.liveMemoryReport"),
      selectedSubtitle: t("sharePoster.selectedSubtitle"),
      liveEvents: t("sharePoster.liveEvents"),
      unlockedCities: t("sharePoster.unlockedCities"),
      unlockedVenues: t("sharePoster.unlockedVenues"),
      countries: t("sharePoster.countries"),
      ticketRounds: t("sharePoster.ticketRounds"),
      mostVisitedCity: t("sharePoster.mostVisitedCity"),
      mostVisitedVenue: t("sharePoster.mostVisitedVenue"),
      firstLive: t("sharePoster.firstLive"),
      latestLive: t("sharePoster.latestLive"),
      weatherRecords: t("sharePoster.weatherRecords"),
      moreMemories: (count) => t("sharePoster.moreMemories", { count }),
      noData: t("common.noData"),
      doors: t("eventTime.doors"),
      start: t("eventTime.start"),
      seat: t("sharePoster.seat"),
      ticketType: t("sharePoster.ticketType"),
      notes: t("sharePoster.notes"),
      weather: t("sharePoster.weather"),
      price: t("sharePoster.price"),
    }),
    [t],
  );

  const selectedEvents = useMemo(
    () => sortedEvents.filter((event) => selectedIds.includes(event.id)),
    [selectedIds, sortedEvents],
  );
  const yearlyEvents = useMemo(
    () => getEventsForSharePosterYear(events, selectedYear),
    [events, selectedYear],
  );
  const hasPosterContent = mode === "selected" ? selectedEvents.length > 0 : yearlyEvents.length > 0;
  const svgString = useMemo(() => {
    if (!hasPosterContent) {
      return "";
    }

    return mode === "selected"
      ? generateSelectedEventsPosterSvg(selectedEvents, {
          theme: posterTheme,
          privacy,
          text: posterText,
          language: i18n.language,
        })
      : generateYearlyReportPosterSvg(yearlyEvents, {
          theme: posterTheme,
          privacy,
          text: posterText,
          language: i18n.language,
          year: selectedYear,
          ticketApplications,
        });
  }, [hasPosterContent, i18n.language, mode, posterText, posterTheme, privacy, selectedEvents, selectedYear, ticketApplications, yearlyEvents]);

  if (!isOpen) {
    return null;
  }

  const toggleSelectedEvent = (eventId: string) => {
    setExportError("");
    setFeedback("");
    setSelectedIds((current) => {
      if (current.includes(eventId)) {
        return current.filter((id) => id !== eventId);
      }

      if (current.length >= SHARE_POSTER_MAX_EVENTS) {
        setFeedback(t("sharePoster.maxEvents"));
        return current;
      }

      return [...current, eventId];
    });
  };

  const selectLatestEvents = () => {
    setFeedback("");
    setExportError("");
    setSelectedIds(sortedEvents.slice(0, SHARE_POSTER_MAX_EVENTS).map((event) => event.id));
  };

  const clearSelection = () => {
    setFeedback("");
    setExportError("");
    setSelectedIds([]);
  };

  const updatePrivacy = (key: keyof SharePosterPrivacyOptions) => {
    setPrivacy((current) => ({ ...current, [key]: !current[key] }));
  };

  const downloadSvg = () => {
    if (!svgString) {
      setExportError(t("sharePoster.selectAtLeastOne"));
      return;
    }

    downloadSvgFile(svgString, getPosterFilename(mode, selectedYear, "svg"));
    setFeedback(t("sharePoster.svgDownloaded"));
    setExportError("");
  };

  const downloadPng = async () => {
    if (!svgString) {
      setExportError(t("sharePoster.selectAtLeastOne"));
      return;
    }

    setIsExportingPng(true);
    setExportError("");

    try {
      await downloadPngFromSvg(svgString, getPosterFilename(mode, selectedYear, "png"));
      setFeedback(t("sharePoster.pngDownloaded"));
    } catch {
      setExportError(t("sharePoster.pngExportFailed"));
    } finally {
      setIsExportingPng(false);
    }
  };

  const copyGitHubLink = async () => {
    setExportError("");

    try {
      await copyTextToClipboard(STAGELOG_GITHUB_URL);
      setFeedback(t("sharePoster.linkCopied"));
    } catch {
      setExportError(t("sharePoster.copyFailed"));
    }
  };

  const emptyMessage =
    events.length === 0
      ? t("sharePoster.noRecords")
      : mode === "selected"
        ? t("sharePoster.selectAtLeastOne")
        : t("sharePoster.noRecordsInYear");

  return (
    <div className="share-poster-modal" role="dialog" aria-modal="true" aria-labelledby="share-poster-title">
      <button className="share-poster-modal__backdrop" type="button" aria-label={t("common.close")} onClick={onClose} />
      <section className="share-poster-modal__panel">
        <header className="share-poster-modal__header">
          <div>
            <span className="eyebrow">{t("sharePoster.cta")}</span>
            <h2 id="share-poster-title">{t("sharePoster.title")}</h2>
            <p>{t("sharePoster.description")}</p>
          </div>
          <button className="icon-button share-poster-modal__close" type="button" aria-label={t("common.close")} onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="share-poster-modal__body">
          <section className="share-poster-modal__controls">
            <div className="poster-segmented" aria-label={t("sharePoster.mode")}>
              <button
                className={mode === "selected" ? "is-active" : ""}
                type="button"
                onClick={() => setMode("selected")}
              >
                {t("sharePoster.selectedEvents")}
              </button>
              <button
                className={mode === "yearly" ? "is-active" : ""}
                type="button"
                onClick={() => setMode("yearly")}
              >
                {t("sharePoster.yearlyReport")}
              </button>
            </div>

            <label className="poster-field">
              {t("sharePoster.posterTheme")}
              <select value={posterTheme} onChange={(event) => setPosterTheme(event.target.value as SharePosterTheme)}>
                {themeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <p className="share-poster-layout-hint">{t("sharePoster.layoutHint")}</p>

            {mode === "selected" ? (
              <section className="poster-event-selector">
                <div className="poster-event-selector__header">
                  <div>
                    <h3>{t("sharePoster.selectedEvents")}</h3>
                    <p>{t("sharePoster.maxEvents")}</p>
                  </div>
                  <div>
                    <button className="ghost-button" type="button" onClick={selectLatestEvents} disabled={sortedEvents.length === 0}>
                      {t("sharePoster.selectLatest12")}
                    </button>
                    <button className="ghost-button" type="button" onClick={clearSelection} disabled={selectedIds.length === 0}>
                      {t("sharePoster.clearSelection")}
                    </button>
                  </div>
                </div>
                <div className="poster-event-selector__list">
                  {sortedEvents.length === 0 ? (
                    <p className="poster-preview-empty">{t("sharePoster.noRecords")}</p>
                  ) : (
                    sortedEvents.map((event) => {
                      const isSelected = selectedIds.includes(event.id);
                      const isDisabled = !isSelected && selectedIds.length >= SHARE_POSTER_MAX_EVENTS;
                      return (
                        <label
                          className={`poster-event-option ${isSelected ? "poster-event-option--selected" : ""}`}
                          key={event.id}
                        >
                          <input
                            checked={isSelected}
                            disabled={isDisabled}
                            type="checkbox"
                            onChange={() => toggleSelectedEvent(event.id)}
                          />
                          <span>
                            <strong>{event.title}</strong>
                            <small>
                              {event.date} / {event.artist} / {event.venueName}
                              {[event.city, event.country].filter(Boolean).length > 0
                                ? ` / ${[event.city, event.country].filter(Boolean).join(", ")}`
                                : ""}
                            </small>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </section>
            ) : (
              <section className="poster-year-section">
                <label className="poster-field">
                  {t("sharePoster.selectYear")}
                  <select
                    disabled={yearOptions.length === 0}
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                  >
                    {yearOptions.length > 0 ? (
                      yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))
                    ) : (
                      <option value={selectedYear}>{selectedYear}</option>
                    )}
                  </select>
                </label>
                <p>{t("sharePoster.yearlyEventCount", { count: yearlyEvents.length })}</p>
              </section>
            )}

            <fieldset className="share-poster-privacy">
              <legend>{t("sharePoster.privacyOptions")}</legend>
              {(
                [
                  ["showSeat", t("sharePoster.showSeat")],
                  ["showPrice", t("sharePoster.showPrice")],
                  ["showNotes", t("sharePoster.showNotes")],
                  ["showWeather", t("sharePoster.showWeather")],
                  ["showTicketType", t("sharePoster.showTicketType")],
                  ["showAttribution", t("sharePoster.showAttribution")],
                ] as Array<[keyof SharePosterPrivacyOptions, string]>
              ).map(([key, label]) => (
                <label key={key}>
                  <input checked={privacy[key]} type="checkbox" onChange={() => updatePrivacy(key)} />
                  {label}
                </label>
              ))}
            </fieldset>

          </section>

          <SharePosterPreview emptyMessage={emptyMessage} isEmpty={!hasPosterContent} svgString={svgString} />
        </div>

        <footer className="share-poster-modal__footer">
          <div className="share-poster-modal__messages" aria-live="polite">
            {feedback ? <p className="share-poster-feedback">{feedback}</p> : null}
            {exportError ? <p className="share-poster-error">{exportError}</p> : null}
          </div>
          <div className="share-poster-modal__actions">
            <button className="primary-button" type="button" disabled={!hasPosterContent} onClick={downloadSvg}>
              <Download size={16} aria-hidden="true" />
              {t("sharePoster.downloadSvg")}
            </button>
            <button className="ghost-button" type="button" disabled={!hasPosterContent || isExportingPng} onClick={downloadPng}>
              <FileImage size={16} aria-hidden="true" />
              {isExportingPng ? t("sharePoster.exportingPng") : t("sharePoster.downloadPng")}
            </button>
            <button className="ghost-button" type="button" onClick={copyGitHubLink}>
              <Copy size={16} aria-hidden="true" />
              {t("sharePoster.copyGithub")}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
